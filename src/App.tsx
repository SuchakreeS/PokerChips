import { GameProvider, useGame } from "./state/GameContext";
import { GameSetup } from "./components/setup/GameSetup";
import { Table } from "./components/table/Table";
import { ActionControls } from "./components/actions/ActionControls";
import { Showdown } from "./components/showdown/Showdown";

function GameScreen() {
  const { state } = useGame();
  if (!state.game) return <GameSetup />;
  return (
    <div className="flex h-dvh flex-col gap-2 overflow-hidden bg-slate-950 p-4">
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <Table />
      </div>
      <div className="shrink-0 space-y-2">
        <Showdown />
        <ActionControls />
      </div>
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
