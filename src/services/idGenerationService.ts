import config from '../config';
import { pool } from '../config/postgres';
import { IdStatus, IIdsStatus, KeyValuePairs, Row, Status } from '../types';
import format from 'pg-format';
import { PoolClient } from 'pg';

export async function findAllMappings(entityType: string): Promise<any> {
  const client = await pool.connect();
  try {
    const results = await client.query('SELECT hash, internal_id FROM id_map WHERE entity_type = $1', [entityType]);
    return results.rows;
  } catch (e: any) {
    console.error(e.message);
    throw new Error(e.message);
  } finally {
    client.release();
  }
}

export async function generateNewId(entityType: string): Promise<string> {
  const client = await pool.connect();
  try {
    const prefix = config.entities.prefixes[entityType].toUpperCase();
    const sequence = config.entities.sequences[entityType];
    const padding = config.entities.padding[entityType];
    const paddingChar = config.entities.paddingCharacter[entityType];

    //SELECT concat('BIO', LPAD(CAST(nextval('biospecimen_seq') AS VARCHAR), 7, '0'))
    const results = await client.query(
      `SELECT concat('${prefix}', LPAD(CAST(nextval('${sequence}') AS VARCHAR), ${padding}, '${paddingChar}'))`
    );

    return results.rows[0].concat;
  } catch (e: any) {
    console.error(e.message);
    throw new Error(e.message);
  } finally {
    client.release();
  }
}

export async function generateNewIdBatch(entityType: string, batchSize: number): Promise<string[]> {
  const client = await pool.connect();
  try {
    const prefix = config.entities.prefixes[entityType].toUpperCase();
    const sequence = config.entities.sequences[entityType];
    const padding = config.entities.padding[entityType];
    const paddingChar = config.entities.paddingCharacter[entityType];

    const results = await client.query(
      // eslint-disable-next-line max-len
      `SELECT concat('${prefix}', LPAD(CAST(nextval('${sequence}') AS VARCHAR), ${padding}, '${paddingChar}')) FROM generate_series(1,${batchSize})`
    );

    return results.rows.map((row) => row.concat);
  } catch (e: any) {
    console.error(e.message);
    throw new Error(e.message);
  } finally {
    client.release();
  }
}
export async function findOrCreateMappingForGivenInternalID(
  entityType: string,
  hash: string,
  internalID: string
): Promise<IdStatus> {
  const client = await pool.connect();

  try {
    let results = await client.query('SELECT internal_id FROM id_map WHERE entity_type = $1 AND hash = $2', [
      entityType,
      hash,
    ]);

    const response: IdStatus = {
      status: Status.FOUND,
      id: undefined,
    };

    //Those not found should be created here:
    if (!results.rows || results.rowCount === 0) {
      try {
        await client.query('INSERT INTO id_map (hash, internal_id, entity_type) VALUES ($1, $2, $3)', [
          hash,
          internalID,
          entityType,
        ]);

        results = await client.query('SELECT internal_id FROM id_map WHERE entity_type = $1 AND hash = $2', [
          entityType,
          hash,
        ]);

        response.status = Status.CREATED;
      } catch (err) {
        console.error(
          `Failed to create entry for: \n\tHash: ${hash} \n\tInternal ID: ${internalID} \n\tEntity Type: ${entityType}`
        );
        console.error(err);

        response.status = Status.FAILED;
        response.id = undefined;
      }
    }

    response.id = results.rows[0]['internal_id'];

    return response;
  } catch (e: any) {
    console.error(e.message);
    throw new Error(e.message);
  } finally {
    client.release();
  }
}

export async function findOrCreateMapping(entityType: string, hashes: string[]): Promise<IIdsStatus> {
  const client = await pool.connect();

  try {
    console.debug(`Query ${hashes.length} ids started`, new Date().toLocaleString());
    let existingResult = await client.query(
      'SELECT internal_id, hash FROM id_map WHERE hash = ANY ($1) AND entity_type = $2',
      [hashes, entityType]
    );
    //Fetched already existing entries
    const existingRows: Row[] = existingResult.rows;
    let missingRows: Row[] = [];

    const notFoundHashes = hashes.filter((r) => !existingRows.map((s) => s.hash).includes(r));

    //Those not found, should be created:
    if (notFoundHashes.length > 0) {
      missingRows = await fetchMissing(notFoundHashes, entityType, client);
    }

    return {
      status: notFoundHashes.length == 0 ? Status.FOUND : Status.CREATED,
      rows: [...existingRows, ...missingRows],
    };
  } catch (e: any) {
    console.error(e.message);
    throw new Error(e.message);
  } finally {
    client.release();
  }
}

async function fetchMissing(notFoundHashes: string[], entityType: string, client: PoolClient): Promise<Row[]> {
  const newInternalIds: string[] = await generateNewIdBatch(entityType, notFoundHashes.length);

  const hashWithInternalId = notFoundHashes.map((e) => ({
    hash: e,
    internalId: newInternalIds[notFoundHashes.indexOf(e)],
  }));

  const values = hashWithInternalId.map((e) => [e.hash, e.internalId, entityType]);

  try {
    //Create missing entries
    console.debug(`Creating ${values.length} missing entries`, new Date().toLocaleString());
    await client.query(format('INSERT INTO id_map (hash, internal_id, entity_type) VALUES %L', values), []);

    //Fetch Missing entries
    console.debug(`Fetching ${values.length} missing entries`, new Date().toLocaleString());
    const missingResult = await client.query(
      'SELECT internal_id, hash FROM id_map WHERE hash = ANY ($1) AND entity_type = $2',
      [notFoundHashes, entityType]
    );

    return missingResult.rows;
  } catch (err: any) {
    console.error(`Failed to create entry for: \n\tHash: ${notFoundHashes} \n\tEntity Type: ${entityType}`);
    console.error(err);
    throw new Error(err.message);
  }
}

/*
 * entityHashMap: A map with the hash value as key and the entity name as value
 * */
export async function batchFindOrCreate(entityHashMap: { [hash: string]: string }): Promise<KeyValuePairs> {
  try {
    let response: Row[] = [];
    const hashesPerEntityType: KeyValuePairs = {};

    for (const hash in entityHashMap) {
      const entityType = entityHashMap[hash];
      const collection = hashesPerEntityType[entityType];
      if (collection) {
        collection.push(hash);
      } else {
        hashesPerEntityType[entityType] = [hash];
      }
    }

    for (const entityType in hashesPerEntityType) {
      const hashes: string[] = hashesPerEntityType[entityType];
      const idStatus: IIdsStatus = await findOrCreateMapping(entityType, hashes);

      response = response.concat(...idStatus.rows);
    }

    return response;
  } catch (e: any) {
    console.error(e.message);
    throw new Error(e.message);
  }
}
