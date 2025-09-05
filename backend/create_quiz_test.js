const http = require('http');

const loginData = JSON.stringify({
  email: 'joyeuxpierreishimwe@gmail.com',
  password: 'Rud@2025!SeLk#HQ'
});

const loginOptions = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': loginData.length
  }
};

const loginReq = http.request(loginOptions, (res) => {
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  res.on('end', () => {
    if (res.statusCode === 200) {
      const { token } = JSON.parse(body);
      console.log('Login successful, got token.');
      createQuiz(token);
    } else {
      console.error('Login failed:');
      console.error(`STATUS: ${res.statusCode}`);
      console.error(`BODY: ${body}`);
    }
  });
});

loginReq.on('error', (e) => {
  console.error(`Problem with login request: ${e.message}`);
});

loginReq.write(loginData);
loginReq.end();

function createQuiz(token) {
  const quizData = {
    subject_id: 1,
    title: "Test Quiz from script",
    description: "Test quiz description",
    time_limit: 30,
    start_time: "2024-01-01T10:00:00",
    end_time: "2024-01-01T12:00:00",
    randomize_questions: false,
    is_team_based: false,
    is_active: true,
    questions: []
  };

  const postData = JSON.stringify(quizData);

  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/quizzes',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': postData.length,
      'Authorization': `Bearer ${token}`
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Create quiz STATUS: ${res.statusCode}`);
    let body = '';
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
      body += chunk;
    });
    res.on('end', () => {
      console.log(`Create quiz BODY: ${body}`);
    });
  });

  req.on('error', (e) => {
    console.error(`problem with create quiz request: ${e.message}`);
  });

  req.write(postData);
  req.end();
}
