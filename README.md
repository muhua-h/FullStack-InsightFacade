# CPSC 310 Project Repository

# InsightUBC Project Overview

The **InsightUBC** project is a comprehensive full-stack web application designed to facilitate efficient querying and analysis of the University of British Columbia's course sections and campus rooms. Its primary objective is to provide users with an intuitive interface to access and interpret university data seamlessly.

## Technical Architecture

### 1. Backend Development
* **Programming Language:** The backend is developed using **TypeScript**, a statically typed superset of JavaScript, which enhances code reliability and maintainability.
* **Runtime Environment:** **Node.js** serves as the server-side environment, enabling efficient execution of TypeScript code outside the browser.
* **Data Management:** The system manages datasets related to courses and rooms, allowing operations such as adding, removing, and listing datasets. Data is stored on disk, adhering to the project's constraint of not utilizing external databases.
* **Query Engine:** A robust query engine processes complex queries based on a defined Extended Backus-Naur Form (EBNF) grammar, facilitating insightful data retrieval.

### 2. Frontend Development
* **User Interface:** The frontend is crafted using standard web technologies—**HTML**, **CSS**, and **JavaScript**—to create an intuitive and responsive user interface.
* **RESTful API Integration:** Communication between the frontend and backend is facilitated through a RESTful API, enabling efficient data exchange and interaction.

### 3. Testing and Quality Assurance
* **Testing Framework:** The project employs **Mocha** and **Chai** for implementing and executing unit tests, ensuring code reliability and adherence to specifications.
* **Continuous Integration:** Automated testing is integrated into the development workflow, providing immediate feedback on code changes and maintaining high-quality standards.

### 4. Development Tools and Practices
* **Package Management:** **Yarn** is utilized for managing project dependencies and scripts, ensuring consistent and reliable package installations.
* **Version Control:** **Git** is employed for version control, facilitating collaborative development and efficient tracking of code changes.
* **Code Quality:** Tools like **ESLint** are integrated to enforce coding standards and maintain code quality throughout the development process.

This architecture ensures a robust, scalable, and maintainable application, providing users with a seamless experience in querying and analyzing university data.

## Configuring your environment

To start using this project, you need to get your computer configured so you can build and execute the code.
To do this, follow these steps; the specifics of each step (especially the first two) will vary based on which operating system your computer has:

1. [Install git](https://git-scm.com/downloads) (v2.X). After installing you should be able to execute `git --version` on the command line.

1. [Install Node LTS](https://nodejs.org/en/download/), which will also install NPM (you should be able to execute `node --version` and `npm --version` on the command line).

1. [Install Yarn](https://yarnpkg.com/en/docs/install) (v1.22+). You should be able to execute `yarn --version` afterwards.

1. Clone your repository by running `git clone REPO_URL` from the command line. You can get the REPO_URL by clicking on the green button on your project repository page on GitHub. Note that due to new department changes you can no longer access private git resources using https and a username and password. You will need to use either [an access token](https://help.github.com/en/github/authenticating-to-github/creating-a-personal-access-token-for-the-command-line) or [SSH](https://help.github.com/en/github/authenticating-to-github/adding-a-new-ssh-key-to-your-github-account).

## Project commands

Once your environment is configured you need to further prepare the project's tooling and dependencies.
In the project folder:

1. `yarn install` to download the packages specified in your project's *package.json* to the *node_modules* directory.

1. `yarn build` to compile your project. You must run this command after making changes to your TypeScript files.

1. `yarn test` to run the test suite.

1. `yarn pretty` to prettify your project code.

## Running and testing from an IDE

IntelliJ Ultimate should be automatically configured the first time you open the project (IntelliJ Ultimate is a free download through their students program)

### License

While the readings for this course are licensed using [CC-by-SA](https://creativecommons.org/licenses/by-sa/3.0/), **checkpoint descriptions and implementations are considered private materials**. Please do not post or share your project solutions. We go to considerable lengths to make the project an interesting and useful learning experience for this course. This is a great deal of work, and while future students may be tempted by your solutions, posting them does not do them any real favours. Please be considerate with these private materials and not pass them along to others, make your repos public, or post them to other sites online.

