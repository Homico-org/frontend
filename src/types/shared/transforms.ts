/**
 * TRANSFORM UTILITIES
 * Functions to transform backend responses (_id) to frontend format (id).
 */

/**
 * Transforms MongoDB _id to id and removes __v
 * Use this when receiving data from the backend.
 */
export function transformEntity<T extends { _id?: string; __v?: number }>(
  entity: T
): Omit<T, '_id' | '__v'> & { id: string } {
  const { _id, __v, ...rest } = entity;
  return {
    ...rest,
    id: _id || (entity as any).id || '',
  } as Omit<T, '_id' | '__v'> & { id: string };
}

/**
 * Transforms an array of entities
 */
export function transformEntities<T extends { _id?: string; __v?: number }>(
  entities: T[]
): (Omit<T, '_id' | '__v'> & { id: string })[] {
  return entities.map(transformEntity);
}

/**
 * Transforms nested entities within an object
 * Useful for responses with populated fields
 */
export function transformNestedEntity<T>(
  entity: T,
  nestedFields: string[]
): T {
  const result = { ...entity } as any;

  for (const field of nestedFields) {
    if (result[field]) {
      if (Array.isArray(result[field])) {
        result[field] = result[field].map((item: any) =>
          item._id ? transformEntity(item) : item
        );
      } else if (typeof result[field] === 'object' && result[field]._id) {
        result[field] = transformEntity(result[field]);
      }
    }
  }

  // Also transform the root entity
  if (result._id) {
    const { _id, __v, ...rest } = result;
    return { ...rest, id: _id } as T;
  }

  return result;
}

/**
 * Prepares data for sending to backend
 * (Generally no transformation needed as backend accepts 'id' in requests)
 */
export function prepareForBackend<T>(data: T): T {
  return data;
}

/**
 * Type guard to check if an entity has _id (backend format)
 */
export function hasMongoId(entity: any): entity is { _id: string } {
  return entity && typeof entity._id === 'string';
}

/**
 * Type guard to check if an entity has id (frontend format)
 */
export function hasId(entity: any): entity is { id: string } {
  return entity && typeof entity.id === 'string';
}

/**
 * Gets the id from an entity, regardless of format
 */
export function getEntityId(entity: any): string | undefined {
  if (!entity) return undefined;
  return entity.id || entity._id;
}

/**
 * Checks if a value is a populated object or just an ID string
 */
export function isPopulated<T>(value: string | T): value is T {
  return typeof value === 'object' && value !== null;
}
