# RUDASUMBWA - Petit Séminaire Saint Léon Kabgayi

## Description

RUDASUMBWA is a comprehensive school management system for Petit Séminaire Saint Léon Kabgayi. It provides a centralized platform for students, teachers, and administrators to manage various academic and extracurricular activities.

## Features

*   **Student Dashboard:** A personalized dashboard for students to view their academic progress, quiz results, notes, courses, and more.
*   **AI Tutor:** An AI-powered tutor named "Peter" that provides personalized lessons, quizzes, and study advice to students.
*   **Quizzes and Learning:** Interactive quizzes, auto-graded questions, and learning materials (Lectiones) for students.
*   **Clubs:** A platform for students to join clubs, interact with peers, and upload portfolios or projects.
*   **Leaderboard and Analytics:** A leaderboard to track student performance and analytics to provide insights into academic progress.
*   **Spiritual Events and Gospel:** A section for students to participate in upcoming spiritual events and follow the daily Gospel.
*   **Teacher Dashboard:** A dashboard for teachers to manage their courses, quizzes, and notes.
*   **Admin Dashboard:** A dashboard for administrators to manage users, courses, clubs, and other system settings.

## Technologies Used

*   **Backend:** Node.js, Express.js, MySQL
*   **Frontend:** HTML, CSS, JavaScript
*   **AI:** Google Gemini Pro

## Installation

1.  Clone the repository:

    ```bash
    git clone https://github.com/your-username/saint-leon-kabgayi.git
    ```

2.  Install the backend dependencies:

    ```bash
    cd backend
    npm install
    ```

3.  Install the frontend dependencies:

    ```bash
    cd ../frontend
    npm install
    ```

4.  Set up the database:

    *   Create a new MySQL database.
    *   Import the `database/schema.sql` file to create the necessary tables.
    *   Update the database configuration in `backend/config/database.js`.

5.  Start the backend server:

    ```bash
    cd ../backend
    npm start
    ```

6.  Open the `frontend/index.html` file in your browser.

## Usage

*   **Students:** Log in to the student dashboard to access your academic information, interact with the AI tutor, and participate in extracurricular activities.
*   **Teachers:** Log in to the teacher dashboard to manage your courses, quizzes, and notes.
*   **Administrators:** Log in to the admin dashboard to manage users, courses, clubs, and other system settings.

## Contributing

Contributions are welcome! Please follow these guidelines:

1.  Fork the repository.
2.  Create a new branch for your feature or bug fix.
3.  Make your changes and commit them with descriptive messages.
4.  Push your changes to your fork.
5.  Create a pull request to the main repository.

## License

This project is licensed under the MIT License.
