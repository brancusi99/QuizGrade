**Quiz Grade** is a fully digital platform designed to offer a simple and efficient way to correct tests, track student results, and analyze individual performance.
Unlike traditional tools (like Zipgrade or GradeCam) that rely on printing and scanning physical paper, Quiz Grade completely digitizes the process—providing instant results and detailed feedback without the need for manual grading.



Key features:

Teachers
* **Digital Test Creation:** Create and customize quizzes with various question types, including **Multiple Choice** and **Open-Ended** questions
* **AI-Powered Grading:** Open-ended questions are automatically corrected with the help of **Artificial Intelligence**
* **Activity Monitoring:** Access a list of students to monitor activity and view results immediately after a test concludes
* **Zero Paperwork:** Eliminate the need for printing, scanning, or manual grade entry

Students
* **Online Testing:** Take tests directly within the platform
* **Instant Feedback:** Receive grades instantly upon submission
* **Performance Tracking:** Access a personal profile to see a history of all grades received throughout the semester
* **Detailed Review:** (Planned) Receive a corrected copy of the test via email for better understanding of mistakes



Technologies 
* **Backend:** Node.js, Express.js 
* **Frontend:** HTML, CSS, EJS (Embedded JavaScript) 
* **Database:** SQLite3
* **Tools:** Nodemon, Git



Installation & Setup
Follow these steps to run the project locally on your machine.

1. Clone the Repository
bash:
git clone [https://github.com/brancusi99/QuizGrade.git](https://github.com/brancusi99/QuizGrade.git)
cd QuizGrade

2. Install Dependencies
Install the required Node.js libraries:

bash:
npm install

3. Database Setup
The project uses SQLite.
You do not need to install any external database software.
When you start the server, it will automatically check for db.sqlite.

If the file is missing, the app will automatically create it and set up the necessary tables.

4. Run the Server
Start the development server (uses Nodemon for auto-restarts):

bash:
npm run devStart

5. Open in Browser
Visit the following URL to see the app: http://localhost:5500

Usage Guide
* Register: Create a new account.
* Dashboard: Log in to access the main student/professor dashboard.
* Create Quiz: (Professor) Navigate to the "Create Quiz" section to build a new test.
* View Results: Check the profile section for graded performance.
