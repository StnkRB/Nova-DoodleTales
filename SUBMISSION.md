# 🎨 DoodleTales: The Magical Storytelling Scout (Amazon Nova 2 Edition)

## Inspiration
Every child's drawing is a window into a vast, hidden world. However, once the drawing is finished, it often remains static on a piece of paper or a digital screen. We were inspired by the idea of "waking up" these drawings—giving the characters voices, personalities, and the ability to go on new adventures while staying true to the child's unique artistic vision. We wanted to turn the act of drawing into a collaborative, living dialogue between a child and an AI companion powered by the latest **Amazon Nova 2** models.

## What it does
DoodleTales is an interactive AI agent that brings children's art to life through three core pillars:
1.  **Vision & Recognition**: Using **Amazon Nova 2 Pro**, the app identifies and segments individual characters and objects within a drawing, mapping their precise locations with "magical halos."
2.  **Multimodal Adventure**: A voice-enabled "Storytelling Scout" engages the child in a conversation. The Scout asks about the characters' names, ages, and roles, reacting dynamically to the child's voice and the drawing itself using **Amazon Nova 2 Pro's** multimodal capabilities.
3.  **Style-Consistent Storytelling**: As the adventure unfolds, the AI generates new scenes for the story. Crucially, these new images use **Amazon Nova 2 Canvas** with the original drawing as a "Style Reference," ensuring that the characters, colors, and "hand-drawn" aesthetic are perfectly preserved in every new frame.

## How we built it
DoodleTales is a full-stack application built with a focus on visual fidelity and creative consistency:
-   **Frontend**: Built with **React** and **Tailwind CSS**, using **Motion** for fluid UI transitions.
-   **AI Intelligence (Amazon Bedrock)**:
    -   `amazon.nova-2-pro-v1:0`: Powers the high-precision character segmentation and the conversational "Storytelling Scout" with **Nova 2** intelligence.
    -   `amazon.nova-2-canvas-v1:0`: Generates new story scenes using the original sketch as a style reference to maintain character identity.
-   **Tool Integration**: We implemented custom tool specifications (`highlight_character`, `generate_story_image`) that allow the Nova 2 models to interact directly with the frontend state.
-   **Infrastructure**: Deployed to **AWS App Runner** for high availability and serverless scaling.

## Challenges we ran into
-   **Style Preservation**: Ensuring the AI respects the "rough sketch" and "crayon" aesthetic of the original child's drawing. We used **Amazon Nova 2 Canvas's** advanced conditioning to lock in the artistic style.
-   **Multimodal Context**: Managing the history of both text and image inputs to ensure the Scout remembers what characters look like as the story progresses.
-   **Coordinate Mapping**: Mapping normalized coordinates from Nova 2 Pro (0-1000) to a responsive frontend container.

## Accomplishments that we're proud of
-   **Character Persistence**: We are incredibly proud of how well **Amazon Nova 2 Canvas** maintains character identity across generated scenes.
-   **The "Magic Halo"**: The visual feedback loop where the AI identifies a character and a golden glow appears around it.
-   **Seamless Integration**: Successfully migrating the entire storytelling engine to the **Amazon Nova 2** ecosystem while maintaining the "magical" feel of the app.

## What we learned
-   **Nova's Versatility**: We learned that **Amazon Nova 2 Pro** is exceptionally good at understanding the nuances of child-like drawings and bounding box detection.
-   **Conditioning is Key**: The "Style Reference" capabilities of **Nova 2 Canvas** are a game-changer for creative applications where consistency is paramount.

## What's next for DoodleTales
-   **Amazon Polly Integration**: Moving from browser-based TTS to high-fidelity **Amazon Polly** voices for a more immersive experience.
-   **Digital Storybooks**: Exporting the entire adventure into a narrated digital book.
-   **Interactive Props**: Letting the child draw new items that the AI immediately recognizes and incorporates into the next scene.
