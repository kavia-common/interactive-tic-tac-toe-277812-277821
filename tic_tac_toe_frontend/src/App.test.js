import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders Tic Tac Toe title and board", () => {
  render(<App />);
  expect(screen.getByText(/Tic Tac Toe/i)).toBeInTheDocument();
  const board = screen.getByRole("grid", { name: /tic tac toe board/i });
  expect(board).toBeInTheDocument();
  // should have 9 gridcells
  const cells = screen.getAllByRole("gridcell");
  expect(cells).toHaveLength(9);
});
