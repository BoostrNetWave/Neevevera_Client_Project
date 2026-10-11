async function testVendor() {
  try {
    const data = {
      companyName: 'Client Demo Vendor Pvt Ltd',
      contactPerson: 'Rahul Constructor',
      email: 'vendor123@demo.com',
      phone: '+91 9999999998',
      gstNumber: '21AABCD1234E1Z1',
      panNumber: 'AABCD1234E',
      tradeCategory: 'civil-construction',
      tradeSubCategory: 'Civil & Marine Contractor',
      regionsServed: ['odisha'],
      pinCode: 'N/A',
      city: 'N/A',
      state: 'N/A',
      message: 'Demo registration'
    };

    console.log('Sending vendor registration...');
    const res = await fetch('http://localhost:5000/api/vendors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!res.ok) {
        console.error('Failed HTTP status:', res.status);
    }
    const json = await res.json();
    console.log('Response:', json);
  } catch (err) {
    console.error('Error:', err);
  }
}

testVendor();
