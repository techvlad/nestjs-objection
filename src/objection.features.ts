import { Model, QueryBuilder, RelationMappings } from 'objection';
export { Model, QueryBuilder };

/* Table */
export function Table(options: Partial<typeof Model>) {
  return function (target: any) {
    target.tableName = target.name;
    Object.keys(options).forEach(item => {
      target[item] = options[item]
    })
  }
}

/* Column */
const allTypes = {
  number: 'number',
  string: 'string',
  boolean: 'boolean',
  object: 'object',
  array: 'array',
  null: 'null',
};
const anyType = Object.values(allTypes).map(item => item);
export const columnTypes = {
  /* knex */
  increments: { key: 'increments', type: [allTypes.number] },
  integer: { key: 'integer', type: [allTypes.number, allTypes.null] },
  bigInteger: { key: 'bigInteger', type: [allTypes.number, allTypes.null] },
  text: { key: 'text', type: [allTypes.string, allTypes.null] },
  string: { key: 'string', type: [allTypes.string, allTypes.null] },
  float: { key: 'float', type: anyType },
  decimal: { key: 'decimal', type: anyType },
  boolean: { key: 'boolean', type: [allTypes.boolean] },
  date: { key: 'date', type: anyType },
  datetime: { key: 'datetime', type: anyType },
  time: { key: 'time', type: anyType },
  timestamp: { key: 'timestamp', type: anyType },
  timestamps: { key: 'timestamps', type: anyType },
  binary: { key: 'binary', type: anyType },
  enu: { key: 'enu', type: anyType },
  json: { key: 'json', type: [allTypes.object] },
  jsonb: { key: 'jsonb', type: [allTypes.object] },
  uuid: { key: 'uuid', type: anyType },
  comment: { key: 'comment', type: anyType },
  engine: { key: 'engine', type: anyType },
  charset: { key: 'charset', type: anyType },
  collate: { key: 'collate', type: anyType },
  inherits: { key: 'inherits', type: anyType },
  /* custom */
  number: { key: 'integer', type: [allTypes.number, allTypes.null] },
  object: { key: 'json', type: [allTypes.object] }
};

export function Column(options?: { type?: typeof columnTypes[keyof typeof columnTypes] }) {
  return function(target: any, propertyKey: string) {
    if (options && options.type) {
      target.constructor.jsonSchema = target.constructor.jsonSchema || {};
      target.constructor.jsonSchema.properties = target.constructor.jsonSchema.properties || {};
      target.constructor.jsonSchema.properties[propertyKey] = options.type;
    }
  }
}

/* Relation */
export const relationTypes = {
  HasManyRelation: Model.HasManyRelation,
  HasOneRelation: Model.HasOneRelation,
  HasOneThroughRelation: Model.HasOneThroughRelation,
  BelongsToOneRelation: Model.BelongsToOneRelation,
} as const;

type RelationMappingItem = RelationMappings[''];
type RelationMappingsThunkItem = () => RelationMappingItem;

export function Relation(relationMapping: RelationMappingItem | RelationMappingsThunkItem) {
  return function(target: any, propertyKey: string) {
    target.constructor.relationMappings = target.constructor.relationMappings || {};
    target.constructor.relationMappings[propertyKey] = relationMapping
  }
}

/* synchronize */
export async function synchronize(model: typeof Model, force?: boolean) {
  const tableName = model.tableName;

  if(force) {
    await model.knex().schema.dropTable(tableName)
  }

  if(!await model.knex().schema.hasTable(tableName)) {
    await model.knex().schema.createTable(tableName, table => {
      table.increments('id').primary();
    })
  }

  const properties = model.jsonSchema?.properties || {};

  for(const item of Object.keys(properties)) {
    const columnName = item;
    const columnType = properties[item]['key'];
    if (await model.knex().schema.hasColumn(tableName, columnName)) {
      return null;
    }
    await model.knex().schema.table(tableName, table => {
      table[columnType](columnName);
    });
  }
}