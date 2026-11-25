# PetCare – Pet Care Management System

**Compassionate Care for Every Pet**

## 1. Project Description

PetCare is a web-based Pet Care Management System developed using Python Flask, HTML, CSS, JavaScript, and Firebase Cloud Firestore. The system provides a centralized platform for managing pet profiles, pet owners, and veterinary appointments.

It features an interactive and responsive interface with database management, search functionality, input validation, and complete CRUD operations.

## 2. Live Website – Vercel Deployment

The PetCare Management System is deployed using Vercel, allowing users to access the website online without running the application locally in PyCharm.

**Website URL:** [https://petcare-five-gamma.vercel.app/](https://petcare-five-gamma.vercel.app/)

**Deployment Platform:** Vercel

**Database:** Firebase Cloud Firestore

**Hosting Platform:** Vercel Cloud

## 3. System Objectives

- Provide a centralized platform for managing pet information.
- Organize pet owner records efficiently.
- Simplify veterinary appointment scheduling.
- Implement complete CRUD operations using Firebase Firestore.
- Maintain accurate and consistent database records.
- Provide a user-friendly and responsive website interface.

## 4. System Features

### Dashboard

- Overview of registered pets
- Overview of registered pet owners
- Veterinary appointment monitoring
- Summary of database records

### Pet Profiles

- Register new pets
- View pet information
- Update pet records
- Delete pet records
- Search registered pets

### Pet Owners

- Register pet owners
- View owner information
- Update contact details
- Delete owner records
- Search registered owners

### Veterinary Appointments

- Schedule appointments
- Select registered pets and owners
- Manage appointment dates and times
- Update appointment status
- View and delete appointment records

### Additional Features

- Responsive website layout
- Interactive navigation
- Search and filtering
- Input validation
- Delete confirmation
- Connected database collections
- Cloud database integration
- Vercel deployment

## 5. Technologies Used

| Technology | Purpose |
|---|---|
| Python | Backend programming |
| Flask | Web application framework |
| HTML5 | Website structure |
| CSS3 | Website styling and design |
| JavaScript | Website interactivity |
| Firebase Firestore | Cloud database management |
| GitHub | Source code management |
| Vercel | Website hosting and deployment |
| PyCharm | Development environment |

## 6. Firebase Firestore Database Structure

The system uses three interconnected Firestore collections.

### Collection 1: owners

| Field | Data Type |
|---|---|
| Document ID | String |
| full_name | String |
| phone | String |
| email | String |
| address | String |
| Creation Timestamp | Timestamp |

### Collection 2: pets

| Field | Data Type |
|---|---|
| Document ID | String |
| name | String |
| species | String |
| breed | String |
| age | Integer |
| sex | String |
| owner_id | String |
| Creation Timestamp | Timestamp |

### Collection 3: appointments

| Field | Data Type |
|---|---|
| Document ID | String |
| owner_id | String |
| pet_id | String |
| date | String |
| time | String |
| service | String |
| status | String |
| Creation Timestamp | Timestamp |

### Database Relationships

- One pet owner can have multiple registered pets.
- One pet can have multiple veterinary appointments.
- Each appointment is associated with a registered pet and its owner.
- Document IDs are used to establish relationships between collections.
- Dependency validation prevents the deletion of records that are still associated with other records.

## 7. CRUD Operations

| Operation | Function |
|---|---|
| Create | Add new pets, owners, and appointments |
| Read | Retrieve and display existing records |
| Update | Modify existing database records |
| Delete | Remove records with dependency validation |
| Search | Find specific records using keywords |

All CRUD operations are designed to communicate with Firebase Cloud Firestore through the Flask backend.

## 8. Project File Structure

- PetCare/
  - app.py
  - firebase_config.py
  - seed.py
  - requirements.txt
  - firestore.rules
  - vercel.json
  - .env.example
  - .gitignore
  - README.md
  - templates/
    - index.html
  - static/
    - css/
      - style.css
    - js/
      - app.js

## 9. Local Installation and Setup

### Step 1: Open the Project

Open the PetCare project folder using PyCharm. Python 3.10 or higher is recommended.

### Step 2: Install Dependencies

Run the following command in the PyCharm terminal:

`python -m pip install -r requirements.txt`

### Step 3: Configure Firebase

1. Open Firebase Console.
2. Create or select a Firebase project.
3. Enable Cloud Firestore.
4. Navigate to Project Settings.
5. Select Service Accounts.
6. Generate a new private key.
7. Save the downloaded file as `ServiceAccountKey.json` inside the local project folder.
8. Publish the supplied `firestore.rules`.

### Step 4: Configure Environment Variables

Create the local environment file using:

`Copy-Item .env.example .env`

Configure the following variables:

- GOOGLE_APPLICATION_CREDENTIALS=ServiceAccountKey.json
- FLASK_DEBUG=false
- PORT=5000

### Step 5: Insert Sample Records

Run the following optional command to populate Firestore with fictional sample records:

`python seed.py`

### Step 6: Run the Application

`python app.py`

Open the local website:

http://127.0.0.1:5000/

## 10. Vercel Deployment Configuration

The PetCare application is deployed through Vercel using its GitHub repository.

### Environment Variables

| Key | Value |
|---|---|
| FIREBASE_SERVICE_ACCOUNT | Complete Firebase service account JSON |
| FLASK_DEBUG | false |

The Firebase configuration supports both local PyCharm development and Vercel cloud deployment.

### Deployment Procedure

1. Upload the project source code to GitHub.
2. Import the GitHub repository into Vercel.
3. Configure the required environment variables.
4. Deploy the Flask application.
5. Verify the website and database connection.

### Deployed Website

**[Open PetCare Management System](https://petcare-five-gamma.vercel.app/)**

## 11. System Testing

The following functions should be tested to ensure proper system operation:

- Firebase Firestore connectivity
- Adding new pet owners
- Registering new pets
- Creating veterinary appointments
- Retrieving existing records
- Updating database records
- Deleting database records
- Searching and filtering records
- Validating required fields
- Validating email addresses
- Preventing invalid pet and owner relationships
- Preventing deletion of linked records
- Website responsiveness
- Vercel deployment functionality

## 12. Security and Limitations

- Firebase credentials are stored separately from the source code.
- Private keys and local environment files must not be uploaded to GitHub.
- Firestore security rules prevent unauthorized direct client access.
- Firebase Admin SDK uses IAM permissions for database access.
- The system is intended for academic and educational purposes.
- The application does not include production-level user authentication.
- Only fictional sample records should be used.
- Access to the deployed application should be restricted to prevent unauthorized database modifications.

## 13. Academic Submission

**Subject:** Advanced Database

**Activity:** Final Practical Activity

**Project Title:** PetCare – Pet Care Management System

**Database:** Firebase Cloud Firestore

**Deployment:** Vercel

**Submission Requirements:**

- Private GitHub repository
- Complete project source code
- README documentation
- Three interconnected Firestore collections
- Complete CRUD functionality
- Input validation
- Search functionality
- Invite `kidlat14` as a GitHub collaborator

**Full Timeliness Credit:** December 6, 2026

**Final Submission Deadline:** December 7, 2026

## 14. Conclusion

PetCare demonstrates the practical application of advanced database management concepts through Python Flask and Firebase Cloud Firestore. It provides an organized and interactive platform for managing pet profiles, owner information, and veterinary appointments.

Through CRUD operations, database relationships, input validation, and Vercel cloud deployment, the system demonstrates how modern web technologies can be integrated to develop an accessible database-driven application.

---

**PetCare – Compassionate Care for Every Pet**

**Powered by Python Flask, Firebase Firestore, and Vercel.**

**Live Website:** https://petcare-five-gamma.vercel.app/
