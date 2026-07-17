const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://tourtravel.yber.in/api/v1';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const isPackageReviewRequest =
    requestUrl.searchParams.has('package_id') ||
    requestUrl.searchParams.has('package_slug');
  const isCustomPackageReviewRequest =
    requestUrl.searchParams.has('inquiry_id') ||
    requestUrl.searchParams.has('trip_inquiry_id') ||
    requestUrl.searchParams.get('review_type') === 'trip_inquiry';
  const backendPath = isPackageReviewRequest
    ? '/api/v1/package-review'
    : isCustomPackageReviewRequest
      ? '/api/v1/custom-package-review'
      : '/api/v1/reviews';
  const backendUrl = new URL(backendPath, BACKEND_BASE_URL.replace(/\/api\/v1\/?$/, ''));

  requestUrl.searchParams.forEach((value, key) => {
    if (key === 'trip_inquiry_id' && !requestUrl.searchParams.has('inquiry_id')) {
      backendUrl.searchParams.set('inquiry_id', value);
    } else if (!['_t', 'review_type', 'trip_inquiry_id'].includes(key)) {
      backendUrl.searchParams.set(key, value);
    }
  });

  if (!backendUrl.searchParams.has('status')) {
    backendUrl.searchParams.set('status', isPackageReviewRequest || isCustomPackageReviewRequest ? 'approved' : 'all');
  }

  if (!isCustomPackageReviewRequest) {
    backendUrl.searchParams.set('_t', String(Date.now()));
  }

  try {
    const response = await fetch(backendUrl.toString(), {
      headers: {
        accept: 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      cache: 'no-store',
    });

    const data = await response.json().catch(() => null);

    return Response.json(
      response.ok && data ? data : { success: false, data: [], summary: { count: 0, average_rating: 0 }, total: 0, message: 'Unable to fetch reviews' },
      { status: 200 }
    );
  } catch (error) {
    console.warn('Reviews proxy unavailable:', error?.message || error);

    return Response.json(
      { success: false, data: [], message: 'Unable to fetch reviews' },
      { status: 200 }
    );
  }
}

export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    const isJsonRequest = contentType.includes('application/json');
    const payload = isJsonRequest ? await request.json() : await request.formData();
    const isTripInquiryReview = isJsonRequest
      ? Boolean(payload?.inquiry_id || payload?.trip_inquiry_id || payload?.review_type === 'trip_inquiry')
      : (
        payload.has('trip_inquiry_id') ||
        payload.has('inquiry_id') ||
        payload.get('review_type') === 'trip_inquiry'
      );
    const backendPath = isTripInquiryReview ? '/api/v1/custom-package-review' : '/api/v1/package-review';
    const backendUrl = new URL(backendPath, BACKEND_BASE_URL.replace(/\/api\/v1\/?$/, ''));

    if (isJsonRequest && !payload.status) {
      payload.status = 'approved';
    } else if (!isJsonRequest && !payload.get('status')) {
      payload.set('status', 'approved');
    }

    const response = await fetch(backendUrl.toString(), {
      method: 'POST',
      headers: {
        accept: '*/*',
        ...(isJsonRequest ? { 'Content-Type': 'application/json' } : {}),
        'ngrok-skip-browser-warning': 'true',
      },
      body: isJsonRequest ? JSON.stringify(payload) : payload,
      cache: 'no-store',
    });

    const data = await response.json().catch(() => null);

    return Response.json(
      data || { success: response.ok, data: null, message: response.ok ? undefined : 'Unable to submit review' },
      { status: response.status }
    );
  } catch (error) {
    console.warn('Review submission proxy unavailable:', error?.message || error);

    return Response.json(
      { success: false, data: null, message: 'Unable to submit review' },
      { status: 502 }
    );
  }
}
