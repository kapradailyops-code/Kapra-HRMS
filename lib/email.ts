import nodemailer from 'nodemailer';

// Standard SMTP configuration (Using Ethereal or standard SMTP for testing)
// In production, these should be securely injected via environment variables.
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT || '587'),
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Helper to determine the 'from' address
const fromAddress = '"Kapra HRMS" <no-reply@kaprahrms.com>';

export async function sendLeaveApprovalEmail(
    employeeEmail: string,
    employeeName: string,
    leaveType: string,
    startDate: string,
    endDate: string,
    icsAttachment?: string
) {
    try {
        const mailOptions: any = {
            from: fromAddress,
            to: employeeEmail,
            subject: `Leave Request Approved: ${leaveType}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Leave Approved</h2>
                    <p>Hi ${employeeName},</p>
                    <p>Great news! Your request for <strong>${leaveType}</strong> from <strong>${startDate}</strong> to <strong>${endDate}</strong> has been approved.</p>
                    <p>We hope you have a great time off. An calendar invite has been attached to this email so you can easily block your schedule.</p>
                    <br/>
                    <p>Best,<br/>Kapra HR Team</p>
                </div>
            `
        };

        if (icsAttachment) {
            mailOptions.attachments = [
                {
                    filename: 'leave-approved.ics',
                    content: icsAttachment,
                    contentType: 'text/calendar'
                }
            ];
        }

        const info = await transporter.sendMail(mailOptions);
        console.log(`[EMAIL] Leave approval sent to ${employeeEmail}. Message ID: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error('[EMAIL_ERROR] Failed to send leave approval:', error);
        return false;
    }
}

export async function sendGoalAssignedEmail(
    employeeEmail: string,
    employeeName: string,
    goalTitle: string,
    dueDate: string
) {
    try {
        const info = await transporter.sendMail({
            from: fromAddress,
            to: employeeEmail,
            subject: `New Performance Goal Assigned: ${goalTitle}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>New Goal Assigned</h2>
                    <p>Hi ${employeeName},</p>
                    <p>A new performance goal has been assigned to you: <strong>${goalTitle}</strong>.</p>
                    <p>This goal is marked with a target completion date of <strong>${dueDate}</strong>.</p>
                    <p>Please log in to the HRMS portal to review the details and start tracking your progress.</p>
                    <br/>
                    <p>Best,<br/>Kapra HR Team</p>
                </div>
            `
        });
        console.log(`[EMAIL] Goal assignment sent to ${employeeEmail}. Message ID: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error('[EMAIL_ERROR] Failed to send goal assignment:', error);
        return false;
    }
}
