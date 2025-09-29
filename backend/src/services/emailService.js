const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: process.env.EMAIL_PORT == 465,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
    } catch (error) {
      logger.error('Failed to initialize email transporter:', error);
    }
  }

  async sendEmail(to, subject, html, text) {
    try {
      if (!this.transporter) {
        throw new Error('Email transporter not initialized');
      }

      const mailOptions = {
        from: `"SEO Audit Tool" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
        text
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to ${to}`);
      return result;
    } catch (error) {
      logger.error('Failed to send email:', error);
      throw error;
    }
  }

  async sendVerificationEmail(email, token) {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email/${token}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Verify Your Email Address</h2>
        <p>Thank you for registering with SEO Audit Tool!</p>
        <p>Please click the button below to verify your email address:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          If you didn't create an account with SEO Audit Tool, you can safely ignore this email.
        </p>
      </div>
    `;

    const text = `
      Verify Your Email Address
      
      Thank you for registering with SEO Audit Tool!
      
      Please visit the following link to verify your email address:
      ${verificationUrl}
      
      This link will expire in 24 hours.
      
      If you didn't create an account with SEO Audit Tool, you can safely ignore this email.
    `;

    return this.sendEmail(
      email,
      'Verify Your Email Address - SEO Audit Tool',
      html,
      text
    );
  }

  async sendPasswordResetEmail(email, token) {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${token}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Reset Your Password</h2>
        <p>You requested a password reset for your SEO Audit Tool account.</p>
        <p>Please click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        <p>This link will expire in 10 minutes.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          If you didn't request a password reset, you can safely ignore this email.
        </p>
      </div>
    `;

    const text = `
      Reset Your Password
      
      You requested a password reset for your SEO Audit Tool account.
      
      Please visit the following link to reset your password:
      ${resetUrl}
      
      This link will expire in 10 minutes.
      
      If you didn't request a password reset, you can safely ignore this email.
    `;

    return this.sendEmail(
      email,
      'Reset Your Password - SEO Audit Tool',
      html,
      text
    );
  }

  async sendAuditCompleteEmail(email, auditData) {
    const reportUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/audit/${auditData.id}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Your SEO Audit is Complete!</h2>
        <p>Your SEO audit for <strong>${auditData.url}</strong> has been completed.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">Overall Score: ${auditData.overallScore}/100</h3>
          <p><strong>Performance:</strong> ${auditData.performance?.score || 0}/100</p>
          <p><strong>Meta Tags:</strong> ${auditData.metaTags?.overallScore || 0}/100</p>
          <p><strong>Images:</strong> ${auditData.images?.overallScore || 0}/100</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${reportUrl}" 
             style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Full Report
          </a>
        </div>
        
        <p>Processing time: ${Math.round(auditData.processingTime / 1000)}s</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          You can view all your audits in your dashboard.
        </p>
      </div>
    `;

    const text = `
      Your SEO Audit is Complete!
      
      Your SEO audit for ${auditData.url} has been completed.
      
      Overall Score: ${auditData.overallScore}/100
      Performance: ${auditData.performance?.score || 0}/100
      Meta Tags: ${auditData.metaTags?.overallScore || 0}/100
      Images: ${auditData.images?.overallScore || 0}/100
      
      View your full report: ${reportUrl}
      
      Processing time: ${Math.round(auditData.processingTime / 1000)}s
    `;

    return this.sendEmail(
      email,
      `SEO Audit Complete - ${auditData.url}`,
      html,
      text
    );
  }

  async sendWeeklyReportEmail(email, reportData) {
    const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Your Weekly SEO Audit Report</h2>
        <p>Here's a summary of your SEO audit activity this week:</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">Weekly Summary</h3>
          <p><strong>Total Audits:</strong> ${reportData.totalAudits}</p>
          <p><strong>Average Score:</strong> ${Math.round(reportData.avgScore)}/100</p>
          <p><strong>Best Score:</strong> ${reportData.bestScore}/100</p>
          <p><strong>Most Audited Domain:</strong> ${reportData.topDomain}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${dashboardUrl}" 
             style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Dashboard
          </a>
        </div>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          You can unsubscribe from weekly reports in your account settings.
        </p>
      </div>
    `;

    const text = `
      Your Weekly SEO Audit Report
      
      Here's a summary of your SEO audit activity this week:
      
      Total Audits: ${reportData.totalAudits}
      Average Score: ${Math.round(reportData.avgScore)}/100
      Best Score: ${reportData.bestScore}/100
      Most Audited Domain: ${reportData.topDomain}
      
      View your dashboard: ${dashboardUrl}
    `;

    return this.sendEmail(
      email,
      'Your Weekly SEO Audit Report',
      html,
      text
    );
  }
}

module.exports = new EmailService();
