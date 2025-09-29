import nodemailer from 'nodemailer'
import twilio from 'twilio'

// Types for different notification channels
export interface NotificationPayload {
  recipient: string
  message: string
  subject?: string
  attachments?: Array<{
    filename: string
    content: string | Buffer
    contentType: string
  }>
}

export interface SMSPayload {
  to: string
  message: string
}

export interface WhatsAppPayload {
  to: string
  message: string
}

// Email configuration
const createEmailTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

// SMS configuration (Twilio)
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null

export class NotificationService {
  
  // Send Email
  static async sendEmail(payload: NotificationPayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const transporter = createEmailTransporter()
      
      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@uniqbrio.com',
        to: payload.recipient,
        subject: payload.subject || 'Payment Reminder - UniqBrio',
        text: payload.message,
        html: this.formatEmailHTML(payload.message),
        attachments: payload.attachments || []
      }
      
      const result = await transporter.sendMail(mailOptions)
      
      return {
        success: true,
        messageId: result.messageId
      }
    } catch (error) {
      console.error('Email sending failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown email error'
      }
    }
  }
  
  // Send SMS via Twilio
  static async sendSMS(payload: SMSPayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!twilioClient) {
        throw new Error('Twilio configuration missing')
      }
      
      const message = await twilioClient.messages.create({
        body: payload.message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: payload.to
      })
      
      return {
        success: true,
        messageId: message.sid
      }
    } catch (error) {
      console.error('SMS sending failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown SMS error'
      }
    }
  }
  
  // Send WhatsApp via Twilio
  static async sendWhatsApp(payload: WhatsAppPayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!twilioClient) {
        throw new Error('Twilio configuration missing')
      }
      
      const message = await twilioClient.messages.create({
        body: payload.message,
        from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
        to: `whatsapp:${payload.to}`
      })
      
      return {
        success: true,
        messageId: message.sid
      }
    } catch (error) {
      console.error('WhatsApp sending failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown WhatsApp error'
      }
    }
  }
  
  // Format email content as HTML
  static formatEmailHTML(textContent: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #9234ea; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .footer { padding: 15px; text-align: center; font-size: 12px; color: #666; }
          .payment-details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .highlight { color: #9234ea; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>UniqBrio Payment Reminder</h2>
          </div>
          <div class="content">
            <pre style="white-space: pre-wrap; font-family: Arial, sans-serif;">${textContent}</pre>
          </div>
          <div class="footer">
            <p>© 2024 UniqBrio. All rights reserved.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }
  
  // Generate QR Code for UPI payments
  static async generatePaymentQR(upiId: string, amount: number, name: string, note: string): Promise<string> {
    try {
      const QRCode = require('qrcode')
      const upiString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`
      
      const qrCodeDataURL = await QRCode.toDataURL(upiString, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      
      return qrCodeDataURL
    } catch (error) {
      console.error('QR Code generation failed:', error)
      throw new Error('Failed to generate payment QR code')
    }
  }
}

export default NotificationService