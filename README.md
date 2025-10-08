# AI Educational Assistant for 5th Grade (Ukrainian Curriculum) 🇺🇦

## Overview

This is an AI-powered homework helper and self-study tool designed specifically for a 5th-grade student following the Ukrainian educational curriculum. It provides detailed, step-by-step solutions for tasks in Mathematics, Ukrainian Language, and History.

The assistant leverages the Google Gemini API to understand and solve problems, acting as a patient and expert tutor. Its primary goal is to help the student understand the "how" and "why" behind solutions, not just to provide the final answer.

## Key Features

-   **Multi-Subject Support:** Get help with Mathematics, Ukrainian Language & Literature, and History of Ukraine.
-   **Flexible Input Methods:**
    -   **URL-Based:** Provide a URL to an online textbook, along with the page and task number, and the AI will find and solve the exact task.
    -   **Image-Based:** Upload or take a photo of the textbook page, and the AI will analyze the image to solve the problem.
-   **Interactive Voice Assistant:**
    -   Listen to both the task and the solution read aloud in Ukrainian.
    -   Features karaoke-style, word-by-word highlighting that stays perfectly in sync with the audio.
    -   Full playback control, including pause, resume, and "skip to the next sentence" for easy navigation through explanations.
-   **Detailed, Formatted Explanations:** Solutions are presented in a clear, easy-to-read format, using lists, bold text, and structured paragraphs to break down complex topics.
-   **Follow-Up Questions:** After receiving a solution, the student can ask clarifying questions in an interactive chat panel to deepen their understanding.
-   **Speech-to-Text Input:** Use the microphone to ask follow-up questions verbally.

## How It Works

The application is built with Angular and uses the **Google Gemini API** as its core intelligence.

1.  The user provides a task via a URL or an image.
2.  The Angular frontend sends a structured prompt to the Gemini API.
3.  For URL-based tasks, the prompt instructs the model to use its Google Search tool to find the exact textbook page and task text, ensuring high accuracy.
4.  For image-based tasks, the image data is sent along with the user's query.
5.  The Gemini model processes the request based on a detailed system instruction that defines its persona as a 5th-grade Ukrainian tutor and specifies the exact output format.
6.  The formatted response is returned to the Angular application, which then parses and displays the task and solution.
7.  The browser's built-in `SpeechSynthesis` and `SpeechRecognition` APIs are used to power the voice interaction features.
