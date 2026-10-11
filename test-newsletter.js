async function testNewsletter() {
  try {
    const data = {
      email: 'demo-user-123@neevevera.com'
    };

    console.log('Subscribing...');
    let res = await fetch('http://localhost:5000/api/newsletter/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    console.log('Response 1:', await res.json());

    console.log('Subscribing again...');
    res = await fetch('http://localhost:5000/api/newsletter/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    console.log('Response 2:', await res.json());

  } catch (err) {
    console.error('Error:', err);
  }
}

testNewsletter();
