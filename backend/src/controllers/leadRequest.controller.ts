import { Request, Response } from 'express';
import { db } from '../db/index';
import { webinarRegistrations } from '../db/schema';

interface LeadRequestBody {
  name: string;
  email: string;
  company: string;
  role: string;
  teamSize: number;
  currentCrm: string;
  bottleneck: string;
  source?: string;
}

export async function createLeadRequest(req: Request, res: Response) {
  try {
    const body = req.body as LeadRequestBody;

    // Basic validation
    if (!body.name || !body.email || !body.company || !body.role || !body.teamSize || !body.currentCrm || !body.bottleneck) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
      });
    }

    // Team size validation
    if (body.teamSize < 1 || body.teamSize > 10000) {
      return res.status(400).json({
        success: false,
        message: 'Team size must be between 1 and 10000',
      });
    }

    // Insert lead request
    await db.insert(webinarRegistrations).values({
      name: body.name,
      email: body.email,
      company: body.company,
      role: body.role,
      teamSize: body.teamSize,
      currentCrm: body.currentCrm,
      bottleneck: body.bottleneck,
      source: body.source || null,
      status: 'pending',
    });

    return res.status(201).json({
      success: true,
      message: 'Your request has been submitted successfully',
    });
  } catch (error: any) {
    console.error('Error creating lead request:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}
