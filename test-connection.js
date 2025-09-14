// Simple connection test
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

console.log('Testing frontend to backend connection...');
console.log('API URL:', API_URL);

// Test 1: Health endpoint
fetch(`${API_URL}/api/health`)
  .then(response => response.json())
  .then(data => {
    console.log('✅ Health Check:', data.success ? 'PASSED' : 'FAILED');
    console.log('Server Status:', data.data?.server?.status);
    console.log('Database Status:', data.data?.database?.status);
  })
  .catch(error => {
    console.log('❌ Health Check FAILED:', error.message);
  });

// Test 2: API Info endpoint  
fetch(`${API_URL}/api/`)
  .then(response => response.json())
  .then(data => {
    console.log('✅ API Info:', data.success ? 'PASSED' : 'FAILED');
    console.log('Available endpoints:', Object.keys(data.data?.endpoints || {}));
  })
  .catch(error => {
    console.log('❌ API Info FAILED:', error.message);
  });

// Test 3: Fake transactions (public endpoint)
fetch(`${API_URL}/api/fake-transactions?count=2`)
  .then(response => response.json())
  .then(data => {
    console.log('✅ Fake Transactions:', data.success ? 'PASSED' : 'FAILED');
    console.log('Transactions count:', data.data?.transactions?.length);
  })
  .catch(error => {
    console.log('❌ Fake Transactions FAILED:', error.message);
  });

// Test 4: Protected endpoint (should fail without token)
fetch(`${API_URL}/api/investments/plans`)
  .then(response => response.json())
  .then(data => {
    if (!data.success && data.messageKey === 'auth.token_required') {
      console.log('✅ Auth Protection: WORKING (token required)');
    } else {
      console.log('❌ Auth Protection: NOT WORKING');
    }
  })
  .catch(error => {
    console.log('🔒 Protected endpoint test:', error.message);
  });