import { render, screen } from '@testing-library/react';
import App from './App';

test('renders FaceTrack text somewhere in the app', () => {
  render(<App />);
  const elements = screen.getAllByText(/FaceTrack/i);
  expect(elements.length).toBeGreaterThan(0);
});
