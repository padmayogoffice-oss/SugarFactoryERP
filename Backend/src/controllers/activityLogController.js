import asyncHandler from '../utils/asyncHandler.js';
import { paginated, buildListQuery } from '../utils/apiResponse.js';
import ActivityLog from '../models/ActivityLog.js';

const listActivityLogs = asyncHandler(async (req, res) => {
  const { page, limit, skip, filter, sort } = buildListQuery(req, {
    searchableFields: ['userName', 'userEmail', 'description', 'resourceLabel'],
    filterableFields: ['module', 'submodule', 'action'],
    defaultSort: '-createdAt',
  });

  const [items, total] = await Promise.all([
    ActivityLog.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    ActivityLog.countDocuments(filter),
  ]);

  return paginated(res, items, { page, limit, total });
});

export { listActivityLogs };
