import { useEffect } from "react";

function App() {
  if (Math.random() > 0.5) {
    useEffect(() => {
      console.log("side effect from hook");
    }, []);
  }

  return (
    <a href="#">broken link</a>
  );
}

export default App;
