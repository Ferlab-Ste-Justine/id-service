import { IdStatus, KeyValuePairs, Status } from './types';
import { env } from './env';
import { connectionPool } from './queries';

export async function findAllMappings(entityType: string): Promise<any> {
    const results = await connectionPool.query('SELECT hash, internal_id FROM id_map WHERE entity_type = $1', [
        entityType,
    ]);
    return results.rows;
}

export async function generateNewId(entityType: string): Promise<string> {
    const prefix = env.entities.prefixes[entityType].toUpperCase();
    const sequence = env.entities.sequences[entityType];
    const padding = env.entities.padding[entityType];
    const paddingChar = env.entities.paddingCharacter[entityType];

    //SELECT concat('BIO', LPAD(CAST(nextval('biospecimen_seq') AS VARCHAR), 7, '0'))
    const results = await connectionPool.query(
        `SELECT concat('${prefix}', LPAD(CAST(nextval('${sequence}') AS VARCHAR), ${padding}, '${paddingChar}'))`
    );

    return results.rows[0].concat;
}

export async function generateNewIdBatch(entityType: string, batchSize: number): Promise<string[]> {
    const prefix = env.entities.prefixes[entityType].toUpperCase();
    const sequence = env.entities.sequences[entityType];
    const padding = env.entities.padding[entityType];
    const paddingChar = env.entities.paddingCharacter[entityType];

    const results = await connectionPool.query(
        `SELECT concat('${prefix}', LPAD(CAST(nextval('${sequence}') AS VARCHAR), ${padding}, '${paddingChar}')) FROM generate_series(1,${batchSize})`
    );

    return results.rows.map((row) => row.concat);
}

export async function findOrCreateMapping(entityType: string, hash: string): Promise<IdStatus> {
    let results = await connectionPool.query('SELECT internal_id FROM id_map WHERE entity_type = $1 AND hash = $2', [
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
}

export async function findOrCreateMappingForGivenInternalID(
    entityType: string,
    hash: string,
    internalID: string
): Promise<IdStatus> {
    let results = await connectionPool.query('SELECT internal_id FROM id_map WHERE entity_type = $1 AND hash = $2', [
        entityType,
        hash,
    ]);

    const response: IdStatus = {
        status: Status.FOUND,
        id: undefined,
    };

    if (!results.rows || results.rowCount === 0) {
        try {
            await connectionPool.query('INSERT INTO id_map (hash, internal_id, entity_type) VALUES ($1, $2, $3)', [
                hash,
                internalID,
                entityType,
            ]);

            results = await connectionPool.query(
                'SELECT internal_id FROM id_map WHERE entity_type = $1 AND hash = $2',
                [entityType, hash]
            );

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
}

/*
 * entityHashMap: A map with the hash value as key and the entity name as value
 * */
export async function batchFindOrCreate(entityHashMap: { [hash: string]: string }): Promise<KeyValuePairs> {
    const response: KeyValuePairs = {};
    const hashesPerEntityType: KeyValuePairs = {};

    for (const hash in entityHashMap) {
        const entityType = entityHashMap[hash];
        let collection = hashesPerEntityType[entityType];
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
            response[hashes[i]] = idStatus.id;
        }
    }

    return response;
}
