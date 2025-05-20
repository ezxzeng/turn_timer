# Board Game Turn Timer

A simple, elegant timer for board games that helps keep each player's turn within a set time limit. Perfect for games where you want to maintain a steady pace and ensure fair play.

## Features

- Set custom time limits (1-60 minutes)
- Multiple warning times with voice announcements
- Pause/Resume functionality
- Large, easy-to-read display
- Simple one-tap reset for the next player
- Audio alerts for warnings and time's up
- Mobile-friendly design
- Works offline
- Free to host on GitHub Pages

## How to Use

1. Enter the desired time limit in minutes (1-60)
2. Configure warning times:
   - Add multiple warning times using the "Add Warning Time" button
   - Set each warning time in seconds (1-60)
   - Remove unwanted warnings using the "×" button
   - Each warning will announce the remaining time
3. Click "Start Timer" to begin
4. During the countdown:
   - Use "Pause" to temporarily stop the timer
   - Click "Resume" to continue the countdown
   - Click "Next Player" to reset the timer for the next player
5. The timer will:
   - Play a warning sound and announce remaining time at each warning point
   - Play a final alarm and announce "Time's up!" when time expires
6. Use "Back to Setup" to change the time limit or warning times

## Hosting on GitHub Pages

1. Create a new GitHub repository
2. Upload all files to the repository
3. Go to repository Settings > Pages
4. Under "Source", select "main" branch
5. Click Save
6. Your timer will be available at `https://[your-username].github.io/[repository-name]`

## Local Development

To run the timer locally:

1. Clone this repository
2. Open `index.html` in your web browser
3. No build process or dependencies required!

## Browser Support

Works in all modern browsers:
- Chrome
- Firefox
- Safari
- Edge

## License

MIT License - feel free to use and modify as needed! 