import config from '../config';
import { pool } from '../config/postgres';
import { IdStatus, KeyValuePairs, Status } from '../types';

export async function findAllMappings(entityType: string): Promise<any> {
  const client = await pool.connect();
  try {
    const results = await client.query('SELECT hash, internal_id FROM id_map WHERE entity_type = $1', [entityType]);
    return results.rows;
  } catch (e: any) {
    console.error(e.message);
    throw new Error(e.message);
  } finally {
    client.release()
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
    client.release()
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
    client.release()
  }
}

export async function findOrCreateMapping(entityType: string, hash: string): Promise<IdStatus> {
  const client = await pool.connect();
  try {
    const results = await client.query('SELECT internal_id FROM id_map WHERE entity_type = $1 AND hash = $2', [
      entityType,
      hash,
    ]);

    if (!results.rows || results.rowCount === 0) {
      const internalId = await generateNewId(entityType);
      return findOrCreateMappingForGivenInternalID(entityType, hash, internalId);
    }

    return {
      status: Status.FOUND,
      id: results.rows[0]['internal_id'],
    };
  } catch (e: any) {
    console.error(e.message);
    throw new Error(e.message);
  } finally {
    client.release()
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

/*
 * entityHashMap: A map with the hash value as key and the entity name as value
 * */
export async function batchFindOrCreate(entityHashMap: { [hash: string]: string }): Promise<KeyValuePairs> {
  try {
    const response = [];
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
      const sequences: string[] = await generateNewIdBatch(entityType, hashes.length);
      for (let i = 0; i < sequences.length; i++) {
        const idStatus: IdStatus = await findOrCreateMappingForGivenInternalID(entityType, hashes[i], sequences[i]);
        response.push({
          hash: hashes[i],
          internal_id: idStatus.id,
        });
      }
    }

    return response;
  } catch (e: any) {
    console.error(e.message);
    throw new Error(e.message);
  }
}
