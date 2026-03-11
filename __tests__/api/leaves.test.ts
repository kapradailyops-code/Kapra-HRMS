import { NextRequest, NextResponse } from 'next/server';
import { PUT } from '../../app/api/leaves/approvals/route';
import { prisma } from '../../lib/prisma';
import { auth } from '../../auth';

// Mock Dependencies
jest.mock('next/server', () => {
    const originalModule = jest.requireActual('next/server');

    class MockNextResponse extends Response {
        static json(body: any, init?: ResponseInit) {
            return new MockNextResponse(JSON.stringify(body), {
                ...init,
                headers: {
                    'Content-Type': 'application/json',
                    ...init?.headers
                }
            });
        }
    }

    return {
        ...originalModule,
        NextResponse: MockNextResponse,
    };
});

jest.mock('../../lib/prisma', () => ({
    prisma: {
        user: { findUnique: jest.fn() },
        leaveRequest: { findUnique: jest.fn() },
        $transaction: jest.fn(),
    }
}));

jest.mock('../../auth', () => ({
    auth: jest.fn(),
}));

jest.mock('../../lib/email', () => ({
    sendLeaveApprovalEmail: jest.fn().mockResolvedValue(true)
}));

jest.mock('../../lib/calendar', () => ({
    buildIcsString: jest.fn().mockReturnValue('BEGIN:VCALENDAR...END:VCALENDAR')
}));


describe('PUT /api/leaves/approvals', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns 401 if unauthenticated', async () => {
        (auth as jest.Mock).mockResolvedValue(null);

        const request = new NextRequest('http://localhost:3000/api/leaves/approvals', {
            method: 'PUT',
            body: JSON.stringify({ requestId: 'req-123', status: 'APPROVED' })
        });

        const response = await PUT(request as unknown as Request);
        expect(response.status).toBe(401);
    });

    it('returns 400 if invalid status is provided', async () => {
        (auth as jest.Mock).mockResolvedValue({
            user: { email: 'admin@kaprahrms.com', role: 'ADMIN' }
        });

        (prisma.user.findUnique as jest.Mock).mockResolvedValue({
            id: 'user-admin',
            email: 'admin@kaprahrms.com'
        });

        const request = new NextRequest('http://localhost:3000/api/leaves/approvals', {
            method: 'PUT',
            body: JSON.stringify({ requestId: 'req-123', status: 'UNKNOWN_STATUS' })
        });

        const response = await PUT(request as unknown as Request);
        expect(response.status).toBe(400);
    });

    it('successfully processes an APPROVED leave request', async () => {
        // Arrange
        (auth as jest.Mock).mockResolvedValue({
            user: { email: 'admin@kaprahrms.com', role: 'ADMIN' }
        });

        (prisma.user.findUnique as jest.Mock).mockResolvedValue({
            id: 'user-admin',
            email: 'admin@kaprahrms.com'
        });

        const mockLeaveRequest = {
            id: 'req-123',
            employeeId: 'emp-123',
            leaveTypeId: 'type-annual',
            startDate: new Date('2026-04-01T00:00:00.000Z'),
            endDate: new Date('2026-04-03T00:00:00.000Z'), // 3 days
            employee: {
                firstName: 'John',
                lastName: 'Doe',
                user: { email: 'john@kaprahrms.com' }
            },
            leaveType: {
                name: 'Annual Leave'
            }
        };

        (prisma.leaveRequest.findUnique as jest.Mock).mockResolvedValue(mockLeaveRequest);

        // Mock the outcome of the transaction
        (prisma.$transaction as jest.Mock).mockResolvedValue({
            ...mockLeaveRequest,
            status: 'APPROVED',
            approverId: 'user-admin'
        });

        const request = new NextRequest('http://localhost:3000/api/leaves/approvals', {
            method: 'PUT',
            body: JSON.stringify({ requestId: 'req-123', status: 'APPROVED' })
        });

        // Act
        const response = await PUT(request as unknown as Request);

        // Assert
        expect(response.status).toBe(200);
        expect(prisma.$transaction).toHaveBeenCalled();

        const responseBody = await response.json();
        expect(responseBody.status).toBe('APPROVED');
    });
});
