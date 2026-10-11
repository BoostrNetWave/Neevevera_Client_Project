async function testContact() {
  try {
    const data = {
      name: 'Client Demo Tester',
      email: 'demo@neevevera.com',
      phone: '+919999999999',
      organization: 'Demo Org',
      serviceCategory: 'Tender / RFQ Submission',
      vendorRegion: 'Odisha HQ Corridor',
      projectScope: 'This is a test scope for the client demo end-to-end check.',
      type: 'contact',
    };

    console.log('Sending enquiry...');
    const res = await fetch('http://localhost:5000/api/enquiries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    console.log('Response:', json);
  } catch (err) {
    console.error('Error:', err);
  }
}

testContact();
