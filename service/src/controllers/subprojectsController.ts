import { getSubprojects } from '../framework/mongo/commitRecords';

import type { FastifyValidatedRoute } from '../types/schemas';
import type { GetSubprojectsRequestSchema } from '../types/schemas/subprojects';

export const getSubprojectsController: FastifyValidatedRoute<GetSubprojectsRequestSchema> = async (req, res) => {
  const subprojects = await getSubprojects(req.params.projectId);

  res.send(subprojects);
};
