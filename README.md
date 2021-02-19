# Id Generation and Mapping Service

## Configuration

The entities are configured in the .env

```properties
#{ENTITY_TYPE}_PREFIX=The prefix for the internal ID.
BIOSPECIMEN_PREFIX=BIO
#{ENTITY_TYPE}_PAD=Number of characters for the padding. 
BIOSPECIMEN_PAD=7
#{ENTITY_TYPE}_PAD_CHAR=Character to be used for the padding. 
BIOSPECIMEN_PAD_CHAR=0
```

## API

### GET /{entity_type}
Returns all the mappings for a given entity type

### GET /id/{entity_type}
Returns an id for the sequence corresponding to the entity name

### GET /batch/{entity_type}/{batch_size}
Returns a range of N id for the sequence corresponding to the entity name (N = batch_size)

### POST /id/{entity_type}/{hash}
Returns the internal id for the entity matching the hash OR creates and returns it if not found.

N.B.: If found, will return an HTTP 200 code along with the internal id.  If created, will return an HTTP *201* code along with the internal id.

### POST /id/{entity_type}/{hash}/{internalID}
Creates a new mapping with the given internal id previously generated using /id/{entity_type} endpoint.

### POST /batch
Create a batch of mappings

Request body format:

```json
{
    "hash" : "entity_type"
}
```

Request body example: 

```json
{
    "alsjf30222v20nv20vn20vn20": "study",
    "ywerwer9y8w0r98yw08ywerey": "study",
    "ywerweraiselajglasj3421ey": "biospecimen",
    "n0gnd098s0f98ns098n0s9n8s": "sample_registration",
    "bwvw98rw98ruvw98rw987v9w8": "sample_registration"
}
```

Response body example:

```json
{
    "alsjf30222v20nv20vn20vn20": "ST0000001",
    "ywerwer9y8w0r98yw08ywerey": "ST0000002",
    "ywerweraiselajglasj3421ey": "BIO0000044",
    "n0gnd098s0f98ns098n0s9n8s": "SA0000001",
    "bwvw98rw98ruvw98rw987v9w8": "SA0000002"
}
```