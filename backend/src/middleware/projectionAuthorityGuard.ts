import { Request, Response, NextFunction } from "express"
import { getTenantLifecycleView } from "../services/tenantStateAggregation.service"

export async function projectionAuthorityGuard(
  req: Request,
  res: Response,
  next: NextFunction
) {

  const tenantId =
    req.params.tenantId ||
    req.body.tenantId ||
    req.query.tenantId

  if (!tenantId) {
    return res.status(400).json({
      error: "TENANT_ID_REQUIRED"
    })
  }

  try {

    const projection =
      await getTenantLifecycleView(tenantId)

    if (!projection) {
      return res.status(404).json({
        error: "TENANT_NOT_FOUND"
      })
    }

    if (projection.derived?.mutationLocked === true) {
      return res.status(403).json({
        error: "MUTATION_LOCKED_BY_PROJECTION"
      })
    }

    (req as any).projection = projection

    next()

  } catch (err) {

    console.error("Projection authority failure", err)

    return res.status(500).json({
      error: "PROJECTION_AUTHORITY_FAILURE"
    })

  }

}
