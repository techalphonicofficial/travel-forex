import { getCompanyInfo } from '@/utils/companyInfo';

export const dynamic = 'force-dynamic';

const getRazorpayCredentials = async () => {
  const companyInfo = await getCompanyInfo();

  return {
    keyId: companyInfo?.payment?.razorpay_key_id || '',
    keySecret: companyInfo?.payment?.razorpay_key_secret || '',
  };
};

export async function POST(request) {
  const { keyId, keySecret } = await getRazorpayCredentials();

  if (!keyId || !keySecret) {
    return Response.json(
      { success: false, message: 'Razorpay keys are not configured in company settings.' },
      { status: 500 }
    );
  }

  try {
    const payload = await request.json();
    const amount = Math.round(Number(payload.amount || 0) * 100);

    if (!Number.isFinite(amount) || amount <= 0) {
      return Response.json(
        { success: false, message: 'A valid payable amount is required.' },
        { status: 400 }
      );
    }

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency: payload.currency || 'INR',
        receipt: payload.receipt || `pkg_${Date.now()}`,
        notes: payload.notes || {},
      }),
      cache: 'no-store',
    });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return Response.json(
        { success: false, message: data?.error?.description || 'Unable to create Razorpay order.', data },
        { status: response.status }
      );
    }

    return Response.json({ success: true, data: { order: data, key_id: keyId } });
  } catch (error) {
    console.error('Razorpay order creation failed:', error);

    return Response.json(
      { success: false, message: 'Unable to create Razorpay order.' },
      { status: 500 }
    );
  }
}
