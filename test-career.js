const fs = require('fs');

async function testCareer() {
  try {
    // 1. Create a dummy resume
    fs.writeFileSync('dummy-resume.pdf', 'Dummy PDF content for testing career upload');
    const fileBlob = new Blob([fs.readFileSync('dummy-resume.pdf')], { type: 'application/pdf' });
    
    const formData = new FormData();
    formData.append('file', fileBlob, 'dummy-resume.pdf');

    console.log('Uploading resume...');
    const uploadRes = await fetch('http://localhost:5000/api/public-upload/resume', {
      method: 'POST',
      body: formData
    });
    const uploadJson = await uploadRes.json();
    console.log('Upload response:', uploadJson);

    if (!uploadJson.success) {
      throw new Error('Upload failed: ' + JSON.stringify(uploadJson));
    }

    // 2. Submit application
    const appData = {
      fullName: 'Demo Applicant',
      email: 'applicant@demo.com',
      phone: '+91 8888888888',
      experience: '5 Years',
      qualification: 'B.Tech Civil Engineering',
      resumeUrl: uploadJson.url
    };

    console.log('Submitting application...');
    const applyRes = await fetch('http://localhost:5000/api/careers/civil-engineer/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appData)
    });
    console.log('Application response:', await applyRes.json());
  } catch (err) {
    console.error('Error:', err);
  }
}

testCareer();
