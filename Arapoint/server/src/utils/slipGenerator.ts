import { NINData, BVNData } from '../services/youverifyService';

interface SlipData {
  html: string;
  reference: string;
  type: 'nin' | 'bvn';
  generatedAt: string;
}

const formatDate = (dateStr: string): string => {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-NG', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).toUpperCase();
  } catch {
    return dateStr;
  }
};

const formatDateLong = (dateStr: string): string => {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-NG', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

const escapeHtml = (str: string): string => {
  if (!str) return 'N/A';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const maskValue = (value: string, showChars: number = 4): string => {
  if (!value || value === 'N/A') return 'N/A';
  if (value.length <= showChars) return value;
  return value.substring(0, showChars) + '*'.repeat(value.length - showChars);
};

export const generateNINSlip = (data: NINData, reference: string, slipType: 'information' | 'regular' | 'standard' | 'premium' = 'standard'): SlipData => {
  const generatedAt = new Date().toISOString();
  const fullName = `${data.lastName || ''} ${data.firstName || ''} ${data.middleName || ''}`.trim().toUpperCase();
  const givenNames = `${data.firstName || ''}, ${data.middleName || ''}`.trim().toUpperCase();
  const issueDate = formatDate(new Date().toISOString());
  
  let html = '';
  
  if (slipType === 'information') {
    html = generateInformationSlip(data, reference, generatedAt);
  } else if (slipType === 'regular') {
    html = generateRegularSlip(data, reference, generatedAt);
  } else if (slipType === 'standard') {
    html = generateStandardSlip(data, reference, generatedAt, issueDate, givenNames);
  } else {
    html = generatePremiumSlip(data, reference, generatedAt, issueDate, givenNames);
  }

  return {
    html,
    reference,
    type: 'nin',
    generatedAt,
  };
};

function generateInformationSlip(data: NINData, reference: string, generatedAt: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NIN Verification Slip - ${reference}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; background: #fff; padding: 20px; }
    .slip { max-width: 900px; margin: 0 auto; border: 1px solid #ddd; padding: 30px; }
    .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #008751; padding-bottom: 15px; margin-bottom: 25px; }
    .header-left { display: flex; align-items: center; gap: 15px; }
    .coat-of-arms { width: 60px; height: 60px; background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="%23008751"/><text x="50" y="55" text-anchor="middle" fill="white" font-size="20">🇳🇬</text></svg>'); background-size: contain; }
    .header-title { text-align: center; flex: 1; }
    .header-title h1 { color: #008751; font-size: 22px; margin-bottom: 5px; }
    .header-title h2 { color: #333; font-size: 18px; }
    .nimc-logo { font-weight: bold; color: #008751; font-size: 24px; }
    .content { display: flex; gap: 30px; }
    .info-section { flex: 1; }
    .info-row { display: flex; margin-bottom: 12px; }
    .info-label { font-weight: bold; width: 140px; color: #333; }
    .info-value { flex: 1; color: #000; }
    .photo-section { display: flex; flex-direction: column; align-items: center; gap: 15px; }
    .photo { width: 120px; height: 150px; border: 2px solid #008751; border-radius: 5px; object-fit: cover; background: #f0f0f0; }
    .verified-badge { background: #e8f5e9; color: #2e7d32; padding: 10px 25px; border-radius: 5px; font-weight: bold; font-size: 18px; }
    .notice { margin-top: 20px; padding: 15px; background: #f5f5f5; border-left: 4px solid #008751; font-size: 12px; }
    .notice p { margin-bottom: 8px; }
    .notice .highlight { color: #c62828; font-weight: bold; }
    @media print { .slip { border: none; } body { padding: 0; } }
  </style>
</head>
<body>
  <div class="slip">
    <div class="header">
      <div class="header-left">
        <div class="coat-of-arms"></div>
      </div>
      <div class="header-title">
        <h1>Federal Republic of Nigeria</h1>
        <h2>Verified NIN Details</h2>
      </div>
      <div class="nimc-logo">NIMC</div>
    </div>
    
    <div class="content">
      <div class="info-section">
        <div class="info-row"><span class="info-label">First Name:</span><span class="info-value">${escapeHtml(data.firstName)}</span></div>
        <div class="info-row"><span class="info-label">Middle Name:</span><span class="info-value">${escapeHtml(data.middleName)}</span></div>
        <div class="info-row"><span class="info-label">Last Name:</span><span class="info-value">${escapeHtml(data.lastName)}</span></div>
        <div class="info-row"><span class="info-label">Date of birth:</span><span class="info-value">${formatDateLong(data.dateOfBirth)}</span></div>
        <div class="info-row"><span class="info-label">Gender:</span><span class="info-value">${escapeHtml(data.gender)}</span></div>
        <div class="info-row"><span class="info-label">NIN Number:</span><span class="info-value" style="font-weight: bold; font-size: 16px;">${escapeHtml(data.id)}</span></div>
        <div class="info-row"><span class="info-label">Tracking ID:</span><span class="info-value">${escapeHtml(reference)}</span></div>
        <div class="info-row"><span class="info-label">Phone Number:</span><span class="info-value">${escapeHtml(data.phone)}</span></div>
        <div class="info-row"><span class="info-label">Residence State:</span><span class="info-value">${escapeHtml(data.state)}</span></div>
        <div class="info-row"><span class="info-label">Residence LGA/Town:</span><span class="info-value">${escapeHtml(data.lga)} / ${escapeHtml(data.town)}</span></div>
        <div class="info-row"><span class="info-label">Birth State:</span><span class="info-value">${escapeHtml(data.birthState)}</span></div>
        <div class="info-row"><span class="info-label">Birth LGA:</span><span class="info-value">${escapeHtml(data.birthLga)}</span></div>
        <div class="info-row"><span class="info-label">Address:</span><span class="info-value">${escapeHtml(data.address)}</span></div>
      </div>
      
      <div class="photo-section">
        ${data.photo ? `<img src="data:image/jpeg;base64,${data.photo}" alt="Photo" class="photo">` : '<div class="photo" style="display: flex; align-items: center; justify-content: center; color: #999;">No Photo</div>'}
        <div class="verified-badge">Verified</div>
        <div style="text-align: center; font-size: 11px; color: #666;">
          This is a property of National Identity Management Commission (NIMC), Nigeria.<br>
          If found, please return to the nearest NIMC's office or contact +234 815 769 1214
        </div>
      </div>
    </div>
    
    <div class="notice">
      <p>1. This NIN slip remains the property of the Federal Republic of Nigeria, and MUST be surrendered on demand;</p>
      <p>2. This NIN slip does not imply nor confer citizenship of the Federal Republic of Nigeria on the individual the document is issued to;</p>
      <p>3. This NIN slip is valid for the lifetime of the holder and <span class="highlight">DOES NOT EXPIRE</span>.</p>
    </div>
    
    <div style="margin-top: 15px; text-align: center; font-size: 11px; color: #666;">
      Reference: ${reference} | Generated: ${new Date(generatedAt).toLocaleString('en-NG')} | Powered by Arapoint
    </div>
  </div>
</body>
</html>
  `.trim();
}

function generateRegularSlip(data: NINData, reference: string, generatedAt: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NIN Slip - ${reference}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Arial', sans-serif; background: #f5f5f5; padding: 20px; }
    .slip { max-width: 500px; margin: 0 auto; background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%); border-radius: 15px; box-shadow: 0 8px 32px rgba(0,0,0,0.15); overflow: hidden; border: 3px solid #008751; }
    .header { background: linear-gradient(135deg, #008751 0%, #006341 100%); color: white; padding: 20px; text-align: center; }
    .header h1 { font-size: 18px; margin-bottom: 8px; letter-spacing: 1px; }
    .header h2 { font-size: 14px; opacity: 0.9; }
    .content { padding: 25px; display: flex; gap: 20px; }
    .photo-container { flex-shrink: 0; }
    .photo { width: 100px; height: 130px; border: 3px solid #008751; border-radius: 8px; object-fit: cover; background: #e8f5e9; }
    .info { flex: 1; }
    .name { font-size: 20px; font-weight: bold; color: #1a1a1a; margin-bottom: 15px; text-transform: uppercase; }
    .field { margin-bottom: 10px; }
    .field-label { font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
    .field-value { font-size: 14px; color: #1a1a1a; font-weight: 500; }
    .nin-section { background: #e8f5e9; padding: 15px; margin: 0 25px 25px; border-radius: 10px; text-align: center; }
    .nin-label { font-size: 12px; color: #666; margin-bottom: 5px; }
    .nin-value { font-size: 28px; font-weight: bold; color: #008751; letter-spacing: 3px; font-family: 'Courier New', monospace; }
    .footer { background: #f8f9fa; padding: 12px 25px; text-align: center; font-size: 10px; color: #666; border-top: 1px solid #e0e0e0; }
    @media print { body { background: white; } .slip { box-shadow: none; } }
  </style>
</head>
<body>
  <div class="slip">
    <div class="header">
      <h1>FEDERAL REPUBLIC OF NIGERIA</h1>
      <h2>National Identification Number Slip (NINS)</h2>
    </div>
    
    <div class="content">
      <div class="photo-container">
        ${data.photo ? `<img src="data:image/jpeg;base64,${data.photo}" alt="Photo" class="photo">` : '<div class="photo" style="display: flex; align-items: center; justify-content: center; color: #999; font-size: 12px;">No Photo</div>'}
      </div>
      <div class="info">
        <div class="name">${escapeHtml(data.lastName)} ${escapeHtml(data.firstName)} ${escapeHtml(data.middleName)}</div>
        <div class="field">
          <div class="field-label">Date of Birth</div>
          <div class="field-value">${formatDate(data.dateOfBirth)}</div>
        </div>
        <div class="field">
          <div class="field-label">Gender</div>
          <div class="field-value">${escapeHtml(data.gender)}</div>
        </div>
        <div class="field">
          <div class="field-label">State of Origin</div>
          <div class="field-value">${escapeHtml(data.birthState)}</div>
        </div>
      </div>
    </div>
    
    <div class="nin-section">
      <div class="nin-label">National Identification Number (NIN)</div>
      <div class="nin-value">${escapeHtml(data.id)}</div>
    </div>
    
    <div class="footer">
      Reference: ${reference} | Generated: ${new Date(generatedAt).toLocaleString('en-NG')} | Arapoint
    </div>
  </div>
</body>
</html>
  `.trim();
}

function generateStandardSlip(data: NINData, reference: string, generatedAt: string, issueDate: string, givenNames: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NIN Card (NGA) - ${reference}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Arial', sans-serif; background: #f5f5f5; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
    .card { width: 500px; height: 320px; background: linear-gradient(135deg, #ffffff 0%, #f0f4f0 50%, #e8f5e9 100%); border-radius: 15px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); position: relative; overflow: hidden; border: 2px solid #ccc; }
    .coat-of-arms { position: absolute; top: 15px; left: 50%; transform: translateX(-50%); width: 70px; height: 70px; background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="30" r="15" fill="%23c0392b"/><rect x="35" y="40" width="30" height="40" fill="%23008751"/><path d="M20 50 L50 90 L80 50" fill="%23f1c40f"/></svg>'); background-size: contain; background-repeat: no-repeat; }
    .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.08; font-size: 150px; color: #008751; pointer-events: none; }
    .photo { position: absolute; left: 25px; top: 90px; width: 100px; height: 130px; background: #e0e0e0; border-radius: 5px; border: 2px solid #ccc; object-fit: cover; }
    .info-section { position: absolute; left: 140px; top: 95px; }
    .field { margin-bottom: 8px; }
    .field-label { font-size: 10px; color: #666; font-style: italic; }
    .field-value { font-size: 14px; font-weight: bold; color: #1a1a1a; text-transform: uppercase; }
    .qr-section { position: absolute; right: 25px; top: 85px; text-align: center; }
    .qr-code { width: 80px; height: 80px; background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="0" y="0" width="100" height="100" fill="white"/><rect x="10" y="10" width="30" height="30" fill="black"/><rect x="60" y="10" width="30" height="30" fill="black"/><rect x="10" y="60" width="30" height="30" fill="black"/><rect x="45" y="45" width="10" height="10" fill="black"/><rect x="65" y="65" width="25" height="25" fill="black"/></svg>'); background-size: contain; border: 1px solid #ccc; }
    .nga-label { font-size: 24px; font-weight: bold; color: #008751; margin-top: 10px; }
    .issue-date { position: absolute; right: 25px; bottom: 80px; text-align: center; }
    .issue-label { font-size: 10px; color: #666; }
    .issue-value { font-size: 12px; font-weight: bold; }
    .nin-section { position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(135deg, #008751 0%, #006341 100%); padding: 15px 25px; text-align: center; }
    .nin-label { font-size: 11px; color: rgba(255,255,255,0.9); margin-bottom: 5px; }
    .nin-value { font-size: 32px; font-weight: bold; color: white; letter-spacing: 8px; font-family: 'Courier New', monospace; }
    .side-nums { position: absolute; top: 50%; transform: translateY(-50%); font-size: 10px; color: rgba(0,0,0,0.2); writing-mode: vertical-lr; }
    .side-nums.left { left: 5px; }
    .side-nums.right { right: 5px; }
    @media print { body { background: white; } .card { box-shadow: none; } }
  </style>
</head>
<body>
  <div class="card">
    <div class="coat-of-arms"></div>
    <div class="watermark">🦅</div>
    <div class="side-nums left">${data.id || '00000000000'}</div>
    <div class="side-nums right">${data.id || '00000000000'}</div>
    
    ${data.photo ? `<img src="data:image/jpeg;base64,${data.photo}" alt="Photo" class="photo">` : '<div class="photo" style="display: flex; align-items: center; justify-content: center; color: #999; font-size: 10px;">No Photo</div>'}
    
    <div class="info-section">
      <div class="field">
        <div class="field-label">Surname/Nom</div>
        <div class="field-value">${escapeHtml(data.lastName)}</div>
      </div>
      <div class="field">
        <div class="field-label">Given Names/Prénoms</div>
        <div class="field-value">${escapeHtml(givenNames)}</div>
      </div>
      <div class="field">
        <div class="field-label">Date of Birth</div>
        <div class="field-value">${formatDate(data.dateOfBirth)}</div>
      </div>
    </div>
    
    <div class="qr-section">
      <div class="qr-code"></div>
      <div class="nga-label">NGA</div>
    </div>
    
    <div class="issue-date">
      <div class="issue-label">ISSUE DATE</div>
      <div class="issue-value">${issueDate}</div>
    </div>
    
    <div class="nin-section">
      <div class="nin-label">National Identification Number (NIN)</div>
      <div class="nin-value">${(data.id || '00000000000').replace(/(.{4})/g, '$1 ').trim()}</div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

function generatePremiumSlip(data: NINData, reference: string, generatedAt: string, issueDate: string, givenNames: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Digital NIN Slip - ${reference}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Arial', sans-serif; background: #333; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
    .card { width: 520px; height: 340px; background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 30%, #a5d6a7 60%, #81c784 100%); border-radius: 18px; box-shadow: 0 15px 50px rgba(0,0,0,0.3); position: relative; overflow: hidden; border: 3px solid #4caf50; }
    .header { background: linear-gradient(135deg, #008751 0%, #004d2e 100%); padding: 12px 20px; text-align: center; }
    .header h1 { color: white; font-size: 18px; letter-spacing: 2px; margin-bottom: 3px; }
    .header h2 { color: rgba(255,255,255,0.85); font-size: 12px; }
    .content { padding: 20px; display: flex; gap: 20px; position: relative; }
    .photo-container { position: relative; }
    .photo { width: 110px; height: 140px; border: 3px solid #4caf50; border-radius: 8px; object-fit: cover; background: #e8f5e9; }
    .fingerprint { position: absolute; bottom: -5px; left: 50%; transform: translateX(-50%); width: 50px; height: 60px; background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 60"><ellipse cx="25" cy="30" rx="20" ry="25" fill="none" stroke="%23333" stroke-width="1" opacity="0.3"/><ellipse cx="25" cy="30" rx="15" ry="20" fill="none" stroke="%23333" stroke-width="1" opacity="0.25"/><ellipse cx="25" cy="30" rx="10" ry="15" fill="none" stroke="%23333" stroke-width="1" opacity="0.2"/></svg>'); background-size: contain; }
    .info { flex: 1; }
    .field { margin-bottom: 10px; }
    .field-label { font-size: 9px; color: #555; text-transform: uppercase; letter-spacing: 0.5px; }
    .field-value { font-size: 15px; font-weight: bold; color: #1a1a1a; text-transform: uppercase; }
    .field-row { display: flex; gap: 20px; }
    .field-row .field { flex: 1; }
    .qr-section { position: absolute; right: 20px; top: 80px; text-align: center; }
    .qr-code { width: 75px; height: 75px; background: white; border: 1px solid #ccc; display: flex; align-items: center; justify-content: center; }
    .qr-code::after { content: ''; width: 65px; height: 65px; background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="0" y="0" width="100" height="100" fill="white"/><rect x="5" y="5" width="25" height="25" fill="black"/><rect x="70" y="5" width="25" height="25" fill="black"/><rect x="5" y="70" width="25" height="25" fill="black"/><rect x="35" y="35" width="30" height="30" fill="black"/><rect x="75" y="75" width="20" height="20" fill="black"/></svg>'); background-size: contain; }
    .nga-badge { font-size: 26px; font-weight: bold; color: #008751; margin-top: 8px; }
    .issue-section { position: absolute; right: 20px; top: 180px; text-align: center; background: rgba(255,255,255,0.7); padding: 8px 12px; border-radius: 5px; }
    .issue-label { font-size: 9px; color: #666; }
    .issue-value { font-size: 11px; font-weight: bold; color: #1a1a1a; }
    .nin-section { position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%); padding: 12px 20px; text-align: center; }
    .nin-label { font-size: 10px; color: rgba(255,255,255,0.85); margin-bottom: 3px; }
    .nin-value { font-size: 30px; font-weight: bold; color: white; letter-spacing: 6px; font-family: 'Courier New', monospace; text-shadow: 1px 1px 2px rgba(0,0,0,0.3); }
    .watermark { position: absolute; top: 55%; left: 25%; transform: translate(-50%, -50%) rotate(-15deg); font-size: 50px; color: rgba(0,135,81,0.08); font-weight: bold; pointer-events: none; }
    .side-id { position: absolute; font-size: 8px; color: rgba(0,0,0,0.15); letter-spacing: 1px; }
    .side-id.left { left: 8px; top: 50%; transform: translateY(-50%) rotate(-90deg); transform-origin: left center; }
    .side-id.right { right: 8px; top: 50%; transform: translateY(-50%) rotate(90deg); transform-origin: right center; }
    @media print { body { background: white; } .card { box-shadow: none; } }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>FEDERAL REPUBLIC OF NIGERIA</h1>
      <h2>DIGITAL NIN SLIP</h2>
    </div>
    
    <div class="watermark">NIMC</div>
    <div class="side-id left">${data.id || '00000000000'}</div>
    <div class="side-id right">${data.id || '00000000000'}</div>
    
    <div class="content">
      <div class="photo-container">
        ${data.photo ? `<img src="data:image/jpeg;base64,${data.photo}" alt="Photo" class="photo">` : '<div class="photo" style="display: flex; align-items: center; justify-content: center; color: #666; font-size: 11px;">No Photo</div>'}
        <div class="fingerprint"></div>
      </div>
      
      <div class="info">
        <div class="field">
          <div class="field-label">Surname/Nom</div>
          <div class="field-value">${escapeHtml(data.lastName)}</div>
        </div>
        <div class="field">
          <div class="field-label">Given Names/Prénoms</div>
          <div class="field-value">${escapeHtml(givenNames)}</div>
        </div>
        <div class="field-row">
          <div class="field">
            <div class="field-label">Date of Birth</div>
            <div class="field-value">${formatDate(data.dateOfBirth)}</div>
          </div>
          <div class="field">
            <div class="field-label">Sex/Sexe</div>
            <div class="field-value">${data.gender ? data.gender.charAt(0).toUpperCase() : 'N/A'}</div>
          </div>
        </div>
      </div>
      
      <div class="qr-section">
        <div class="qr-code"></div>
        <div class="nga-badge">NGA</div>
      </div>
      
      <div class="issue-section">
        <div class="issue-label">ISSUE DATE</div>
        <div class="issue-value">${issueDate}</div>
      </div>
    </div>
    
    <div class="nin-section">
      <div class="nin-label">National Identification Number (NIN)</div>
      <div class="nin-value">${(data.id || '00000000000').replace(/(.{4})/g, '$1 ').trim()}</div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export const generateBVNSlip = (data: BVNData, reference: string, slipType: 'standard' | 'premium' = 'standard'): SlipData => {
  const generatedAt = new Date().toISOString();
  const fullName = `${data.lastName || ''} ${data.firstName || ''} ${data.middleName || ''}`.trim().toUpperCase();
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BVN Verification Slip - ${reference}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Arial', sans-serif; background: #f5f5f5; padding: 20px; }
    .slip { max-width: 550px; margin: 0 auto; background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 50%, #90caf9 100%); border-radius: 18px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); overflow: hidden; border: 3px solid #1565c0; }
    .header { background: linear-gradient(135deg, #1565c0 0%, #0d47a1 100%); color: white; padding: 20px; text-align: center; }
    .header h1 { font-size: 18px; letter-spacing: 2px; margin-bottom: 5px; }
    .header h2 { font-size: 12px; opacity: 0.9; }
    .content { padding: 25px; display: flex; gap: 25px; }
    .photo-container { flex-shrink: 0; }
    .photo { width: 120px; height: 150px; border: 3px solid #1565c0; border-radius: 10px; object-fit: cover; background: #e3f2fd; }
    .info { flex: 1; }
    .name { font-size: 22px; font-weight: bold; color: #0d47a1; margin-bottom: 15px; text-transform: uppercase; }
    .bvn-display { background: white; padding: 12px; border-radius: 8px; margin-bottom: 15px; text-align: center; border: 2px solid #1565c0; }
    .bvn-label { font-size: 10px; color: #666; text-transform: uppercase; }
    .bvn-value { font-size: 26px; font-weight: bold; color: #1565c0; letter-spacing: 4px; font-family: 'Courier New', monospace; }
    .watchlist { display: inline-block; padding: 5px 15px; border-radius: 20px; font-size: 11px; font-weight: bold; margin-top: 8px; }
    .watchlist.clear { background: #c8e6c9; color: #2e7d32; }
    .watchlist.flagged { background: #ffcdd2; color: #c62828; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .field { padding: 10px; background: rgba(255,255,255,0.7); border-radius: 6px; }
    .field.full { grid-column: span 2; }
    .field-label { font-size: 9px; color: #555; text-transform: uppercase; letter-spacing: 0.5px; }
    .field-value { font-size: 13px; font-weight: 600; color: #1a1a1a; margin-top: 3px; }
    .footer { background: #1565c0; color: white; padding: 12px 20px; text-align: center; font-size: 10px; }
    @media print { body { background: white; } .slip { box-shadow: none; } }
  </style>
</head>
<body>
  <div class="slip">
    <div class="header">
      <h1>BANK VERIFICATION NUMBER</h1>
      <h2>Nigeria Inter-Bank Settlement System (NIBSS)</h2>
    </div>
    
    <div class="content">
      <div class="photo-container">
        ${data.photo ? `<img src="data:image/jpeg;base64,${data.photo}" alt="Photo" class="photo">` : '<div class="photo" style="display: flex; align-items: center; justify-content: center; color: #666; font-size: 11px;">No Photo</div>'}
      </div>
      
      <div class="info">
        <div class="name">${escapeHtml(fullName)}</div>
        
        <div class="bvn-display">
          <div class="bvn-label">Bank Verification Number</div>
          <div class="bvn-value">${escapeHtml(data.id)}</div>
          ${data.watchListed !== undefined ? `
          <div class="watchlist ${data.watchListed ? 'flagged' : 'clear'}">
            ${data.watchListed ? '⚠ WATCHLISTED' : '✓ NOT WATCHLISTED'}
          </div>
          ` : ''}
        </div>
        
        <div class="info-grid">
          <div class="field">
            <div class="field-label">Date of Birth</div>
            <div class="field-value">${formatDate(data.dateOfBirth)}</div>
          </div>
          <div class="field">
            <div class="field-label">Gender</div>
            <div class="field-value">${escapeHtml(data.gender || 'N/A')}</div>
          </div>
          <div class="field">
            <div class="field-label">Phone Number</div>
            <div class="field-value">${escapeHtml(data.phone)}</div>
          </div>
          <div class="field">
            <div class="field-label">Email</div>
            <div class="field-value">${escapeHtml(data.email)}</div>
          </div>
          <div class="field full">
            <div class="field-label">Enrollment Branch</div>
            <div class="field-value">${escapeHtml(data.enrollmentBranch)}</div>
          </div>
          <div class="field full">
            <div class="field-label">Enrollment Institution</div>
            <div class="field-value">${escapeHtml(data.enrollmentInstitution)}</div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="footer">
      Reference: ${reference} | Generated: ${new Date(generatedAt).toLocaleString('en-NG')} | Powered by Arapoint
    </div>
  </div>
</body>
</html>
  `.trim();

  return {
    html,
    reference,
    type: 'bvn',
    generatedAt,
  };
};

export type { SlipData };
