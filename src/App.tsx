import { GameProvider, useGame } from "./state/GameContext";
import { GameSetup } from "./components/setup/GameSetup";
import { Table } from "./components/table/Table";
import { ActionControls } from "./components/actions/ActionControls";
import { Showdown } from "./components/showdown/Showdown";

function GameScreen() {
  const { state } = useGame();
  if (!state.game) return <GameSetup />;
  return (
    <div className="space-y-4 p-4">
      <Table />
      <Showdown />
      <ActionControls />
    </div>
  );
}

function App() {
  return (
    <GameProvider>
      <GameScreen />
    </GameProvider>
  );
}

export default App;
