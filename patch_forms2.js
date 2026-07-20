const fs = require('fs');
const path = require('path');

const filesToPatch = [
  { path: 'app/tours/[slug]/TourDetailClient.js', handler: 'const handleReviewSubmit = (event) => {' },
  { path: 'app/itineraries/[id]/TripInquiryDetailClient.js', handler: 'const submitItineraryReview = async (e) => {' },
  { path: 'app/itineraries/[id]/TripInquiryDetailClient.js', handler: 'const handleInquirySubmit = async (e) => {' },
  { path: 'app/dashboard/page.js', handler: 'const submitReview = async (e) => {' }
];

const injectCode = `
    const token = getStoredToken();
    if (!token) {
      toast.error('Please login first to continue.');
      router.push(\`/auth/login?redirect=\${encodeURIComponent(window.location.pathname)}\`);
      return;
    }
`;

filesToPatch.forEach(fileDef => {
  const fullPath = path.join(__dirname, fileDef.path);
  if (!fs.existsSync(fullPath)) {
    console.log('Skipping (not found):', fullPath);
    return;
  }

  let code = fs.readFileSync(fullPath, 'utf8');

  // 1. Ensure useRouter is imported
  if (!code.includes('useRouter')) {
    code = code.replace(/import {.*?}.*?from 'next\/navigation';/g, match => {
      if (!match.includes('useRouter')) {
        return match.replace('{', '{ useRouter,');
      }
      return match;
    });
    if (!code.includes('useRouter')) {
      code = code.replace(/(import .*?;\\n)/, "$1import { useRouter } from 'next/navigation';\\n");
    }
  }

  // 2. Ensure toast is imported
  if (!code.includes('react-hot-toast')) {
    code = code.replace(/(import .*?;\\n)/, "$1import toast from 'react-hot-toast';\\n");
  }

  // 3. Ensure getStoredToken is imported
  if (!code.includes('getStoredToken')) {
    code = code.replace(/import {.*?}.*?from '@\/utils\/api';/g, match => {
      if (!match.includes('getStoredToken')) {
        return match.replace('{', '{ getStoredToken,');
      }
      return match;
    });
    if (!code.includes('getStoredToken')) {
      code = code.replace(/(import .*?;\\n)/, "$1import { getStoredToken } from '@/utils/api';\\n");
    }
  }

  // 4. Ensure router is instantiated
  // Find component declaration
  const compRegex = /export default (?:async )?function \w+\(.*?\) \{/;
  const match = compRegex.exec(code);
  if (match) {
    const compStart = match.index + match[0].length;
    const afterComp = code.slice(compStart);
    if (!afterComp.includes('const router = useRouter()')) {
      code = code.slice(0, compStart) + '\\n  const router = useRouter();' + code.slice(compStart);
    }
  }

  // 5. Inject guard in handler
  if (code.includes(fileDef.handler) && !code.includes(fileDef.handler + injectCode)) {
    const safeInjectCode = injectCode.replace(/\\$/g, '$$$$');
    code = code.replace(fileDef.handler, fileDef.handler + safeInjectCode);
  }

  fs.writeFileSync(fullPath, code);
  console.log('Patched:', fileDef.path);
});
