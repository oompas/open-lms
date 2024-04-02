<!--
[![Build Status](badge)](link)
[![Version](badge)](link)
-->

# OpenLMS - An Open-Source LMS Platform

Welcome to the official repository for the OpenLMS platform created at Queen's University. This repository is a comprehensive collection of our generic & extensible platform code as well as our official documentation that may assist in initializing, configuring, and modifying your own instance of the platform.

The Open-Source LMS platform aims to make open education more accessible and usable to organizations. A blessing in the open education space is the ease of access to many great third-party courses hosted on unique online platforms. However, the curse and subsequent challenge lies in the lack of centralized platform which can be used to assign and track the completion of these courses.

The platform is ready to use and will function effectively out of the box after creating an instance and configuring minor setup details. However, the code base is intentionally structured to be easily extensible to fit your organization's needs. 

## Overview
![Next JS](https://img.shields.io/badge/Next-black?style=for-the-badge&logo=next.js&logoColor=white)
![Vercel](https://img.shields.io/badge/vercel-%23000000.svg?style=for-the-badge&logo=vercel&logoColor=white)
![Firebase](https://img.shields.io/badge/firebase-a08021?style=for-the-badge&logo=firebase&logoColor=ffcd34)
![Cloudflare](https://img.shields.io/badge/Cloudflare-F38020?style=for-the-badge&logo=Cloudflare&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)

#### To streamline our development process and fit the needs of most organizations, we utilize these frameworks and services:

- Next.js is an open-source web meta framework using React to enable hybrid rendering of both the server and client side to significantly improve performance and SEO using Typescript. and we use it because ...

- Vercel is a cloud platform allowing developers to easily deploy web applications enabling a seamless experience by taking care of deployment and scaling so developers can focus on their code. and we use it because ...

- Firebase is a collection of Google-powered back-end cloud computing services designed to simplify and enhance API creation, improvement, and growth. It offers key services like authentication, databases, and serverless functions, reducing the complexity and maintenance required for instance management using TypeScript. The OpenLMS core team specifically chose it due to it's reliability, simplisticity, and ease to scale and extend platform functionalities, making it ideal for minimizing technical overlead.

- Cloudflare is a global network designed to be secure, private, fast, and reliable. OpenLMS uses Cloudflare as a proxy between the Vercel production deployment and the user accessing the instance. This makes it ideal to migiate against potential DDoS attacks and simplify the instance's DNS services as well.

- **Essentially, the tech stack choices were made with the ease of deployment and extensibility for future developers in mind!**

### Potential Costs

- For most organizations, the Vercel free `Hobby` tier is recommended, but larger organizations or those with specific needs for deployment may use other methods to host the instance with varying costs associated with this.
- The Firebase paid `Blaze` tier is required, but the costs are [generally very low](https://firebase.google.com/pricing). Small projects likely have no variable costs (100,000 document reads per day and 2 million API calls per month for free) and only a few dolalrs for fixed costs.
- A domain name is an optional but desirable thing to use in the production deployment of an instance for a cohesive platform look. We recommend [Porkbun](https://porkbun.com) or [Cloudflare Register](https://www.cloudflare.com/products/registrar/) for the lowest priced domains, but almost any domain registrar suffices!

### Getting Started

- To get started with an initial instance, check out our platform developer guide for more detailed instructions. [Visit Developer Guide](https://github.com/oompas/open-lms/blob/main/public/OpenLMS%20Developer%20Guide.pdf)
- For ideas on potential features to extend the platform's functionality, check out our platform project board and look under the `No Status` column for drafts and closed issues. [Visit Project Board](https://github.com/users/oompas/projects/5)

## Team

### Core Team
| ![Anthony Galassi](https://drive.google.com/uc?export=download&id=1CKWzh3dyAVugYd8g6BBqkkzvGUCVLpqH) | ![Sara Hall](https://drive.google.com/uc?export=download&id=1THsEJCBtPCJl7L3iLRlJKI_KRad1RkW5) | ![Reid Moffat](https://drive.google.com/uc?export=download&id=1onmw4S-C-H1L18v5cRWrneMN6kzKJBFX) | ![Graham Carkner](https://drive.google.com/uc?export=download&id=1j8CEFAl7r4EMzm1IUTODXt64iOFMRx7b) | ![Louie Chung](https://drive.google.com/uc?export=download&id=1ys_YnMh3-PGRhqT3ItlPQtTySZYzu4C3) |
|:-----------------------------:|:-----------------------:|:-------------------------:|:----------------------------:|:-------------------------:|
| [Anthony Galassi](https://www.linkedin.com/in/anthonygalassi/) <br> Project Manager & Back-End Developer | [Sara Hall](https://www.linkedin.com/in/sara-hall-canada/) <br> Front-End Developer | [Reid Moffat](https://www.linkedin.com/in/reid-moffat/) <br> Lead Back-End Developer | [Graham Carkner](https://www.linkedin.com/in/gcarkner/) <br> Lead Front-End Developer | Louie Chung <br> Front-End Developer |

### Stakeholders
| <img src="https://drive.google.com/uc?export=download&id=1SWz4yMJFJFJKUtBn_a0_WGdA0e4N_vqw" width="200" alt="Steven Ding"/> | <img src="https://drive.google.com/uc?export=download&id=1YlQIOLovDFcG7FGfI9ppW3jHB4r2ZA_k" width="200" alt="Meghan Norris"/> |
|:-----------------------------:|:-----------------------:|
| [Steven Ding](https://www.linkedin.com/in/stevenhding/) <br> Supervisor <br> Assistant Professor in Computing at Queen's University  | [Meghan Norris](https://www.linkedin.com/in/meghan-e-norris-0098b729/) <br> Customer <br> Chair of Undergraduate Studies in Psychology at Queen's University |

## Acknowledgements

We sincerely thank Steven Ding and Meghan Norris for all of their guidance, advice, feedback, and time that they've given us in developing this platform. It truly has improved the overall quality of our capstone project and each team member has come out of this project having learned many things and become a stronger software developer.

We'd also like to acknowledge our course coordinator Dr. Anwar Hossain for enabling us to put our best foot forward via his feedback to our capstone presentations throughout the course!

We look forward to continuing our journey in the Computing world!

---

For more information or to ask questions not answered by our respository resources, please get in touch with anyone from the core team through LinkedIn.
