import crypto from 'node:crypto';
import { getCompanyInfo } from '@/utils/companyInfo';

export const dynamic = 'force-dynamic';

const getRazorpaySecret = async () => {
  const companyInfo = await getCompanyInfo();
  return companyInfo?.payment?.razorpay_key_secret || '';
};

export async function POST(request) {
  const keySecret = await getRazorpaySecret();

  if (!keySecret) {
    return Response.json(
      { success: false, message: 'Razorpay secret is not configured in company settings.' },
      { status: 500 }
    );
  }

  try {
    const payload = await request.json();
    const orderId = payload.razorpay_order_id;
    const paymentId = payload.razorpay_payment_id;
    const signature = payload.razorpay_signature;

    if (!orderId || !paymentId || !signature) {
      return Response.json(
        { success: false, message: 'Missing Razorpay payment verification fields.' },
        { status: 400 }
      );
    }

    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    const expectedBuffer = Buffer.from(expectedSignature);
    const receivedBuffer = Buffer.from(signature);
    const verified = expectedBuffer.length === receivedBuffer.length && crypto.timingSafeEqual(
      expectedBuffer,
      receivedBuffer
    );

    return Response.json({
      success: verified,
      message: verified ? 'Payment verified successfully.' : 'Payment verification failed.',
      data: verified ? { order_id: orderId, payment_id: paymentId } : null,
    }, { status: verified ? 200 : 400 });
  } catch (error) {
    console.error('Razorpay payment verification failed:', error);

    return Response.json(
      { success: false, message: 'Unable to verify Razorpay payment.' },
      { status: 500 }
    );
  }
}
