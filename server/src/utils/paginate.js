/**
 * paginate(Model, query, req) — server-side pagination helper.
 *
 * Used on EVERY list route from day one. Retrofitting pagination later is
 * more disruptive than building it in from the start.
 *
 * Hard ceiling of 100 items per page to prevent abuse.
 * Default page size: 20.
 *
 * Returns: { items, total, page, pages }
 *
 * options.populate — passed directly to Mongoose .populate() if provided.
 */
export async function paginate(Model, query, req, options = {}) {
  const page  = Math.max(parseInt(req.query.page)  || 1,  1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const skip  = (page - 1) * limit;
  const sort  = options.sort || { createdAt: -1 };

  let findQuery = Model.find(query).skip(skip).limit(limit).sort(sort);
  if (options.populate) findQuery = findQuery.populate(options.populate);

  const [items, total] = await Promise.all([
    findQuery.lean(),
    Model.countDocuments(query),
  ]);

  return { items, total, page, pages: Math.ceil(total / limit) };
}

