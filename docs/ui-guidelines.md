# UI Guidelines

## Purpose

This document defines the core UI guidelines for the TODO application. The goal is to keep the user experience consistent, accessible, and clear across the frontend implementation.

## Design Direction

1. The UI should feel simple, clean, and task-focused.
2. The layout should prioritize readability over decoration.
3. The interface should help users quickly understand what tasks need attention.
4. Visual styling should support the core behaviors defined in the functional requirements.

## Component Guidelines

1. The frontend should use Material UI components for common interface elements where practical.
2. Buttons, form fields, dialogs, checkboxes, and alerts should use a consistent component library rather than a mix of custom and third-party patterns.
3. Custom styling may be added on top of Material UI, but the interaction behavior of standard controls should remain familiar and predictable.
4. Reusable UI elements should be implemented as shared components when the same pattern appears in multiple places.

## Layout Guidelines

1. The main task list should be the visual focal point of the page.
2. Primary actions, such as adding a task, should appear in an obvious and easy-to-find location.
3. Related controls should be grouped together, such as filters, sorting, and task actions.
4. The UI should provide adequate spacing between sections, form fields, and task items.
5. The application should work well on both desktop and mobile screen sizes.

## Color and Visual Style

1. The application should use a restrained, professional color palette.
2. Primary actions should use a consistent primary color across the app.
3. Destructive actions, such as delete, should use a distinct error color.
4. Completed tasks should be visually distinguishable from active tasks without making them unreadable.
5. Color should not be the only method used to communicate task status, validation state, or action meaning.

### Recommended Palette

1. Primary color: deep blue, such as `#1F4E79`.
2. Secondary color: teal, such as `#2A7F62`.
3. Background color: off-white or light gray, such as `#F7F9FC`.
4. Surface color: white, such as `#FFFFFF`.
5. Error color: red, such as `#C0392B`.
6. Text color: dark gray or navy, such as `#1F2933`.

## Typography

1. Typography should be easy to read and consistent across screens.
2. The application should use a clear sans-serif font family.
3. Headings should establish hierarchy without overwhelming the interface.
4. Body text, form labels, and task metadata should remain legible on small screens.
5. Text used for completed tasks may be visually subdued, but it must remain readable.

## Button and Control Styles

1. Primary buttons should be visually prominent and reserved for the main action in a section.
2. Secondary buttons should be visually quieter than primary buttons.
3. Destructive buttons should clearly communicate risk before the action is taken.
4. Icon-only buttons must include an accessible label.
5. Interactive controls must include visible hover, focus, and disabled states.

## Task List Presentation

1. Each task item should clearly display the task title.
2. Optional metadata, such as due date or description preview, should be visually secondary to the title.
3. Completed tasks should appear distinct through styling such as a muted tone, status indicator, or strikethrough, while remaining accessible.
4. Task actions, such as edit and delete, should be easy to find without cluttering the list.
5. Overdue tasks should be visually identifiable.

## Forms and Validation

1. Task creation and editing forms should clearly label every field.
2. Required fields should be identified consistently.
3. Validation messages should appear near the relevant field.
4. Validation messages should explain what the user needs to correct.
5. Form controls should remain usable with keyboard-only navigation.

## Accessibility Requirements

1. The UI should meet WCAG 2.1 AA accessibility expectations where practical for the initial version.
2. All interactive elements must be reachable and operable by keyboard.
3. Visible focus indicators must be present for links, buttons, inputs, and custom interactive controls.
4. Text and interactive controls must maintain sufficient color contrast.
5. Form inputs must have associated labels.
6. Status changes, errors, and confirmations should be exposed in an accessible way.
7. The UI should not rely solely on color to convey meaning.
8. Touch targets should be large enough for mobile use.

## Feedback and States

1. The application should show clear empty states when no tasks exist.
2. The application should show useful loading states when data is being fetched or saved.
3. The application should show understandable error states when an action fails.
4. Success feedback should be brief and unobtrusive.
5. Confirmation should be required before destructive actions that permanently remove data.

## Consistency Rules

1. The same action should always look and behave the same across the application.
2. Terminology should be consistent across labels, buttons, messages, and headings.
3. Date formatting should be consistent wherever due dates are shown.
4. Spacing, border radius, and shadow usage should follow a small, repeatable set of design tokens.

## Acceptance Intent

A UI implementation should be considered complete only if:

1. It supports the behaviors described in the functional requirements.
2. It follows the visual and interaction rules described in this document.
3. It remains usable on both desktop and mobile screen sizes.
4. It satisfies core accessibility and validation expectations.