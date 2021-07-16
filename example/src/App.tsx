import React, { useLayoutEffect, useRef } from "react";
import "./App.css";
import FullPageSnap from "react-full-page-snap";
import "react-full-page-snap/dist/index.css";

function App() {
  const ref = useRef<React.ElementRef<typeof FullPageSnap>>(null);

  useLayoutEffect(() => {
    setTimeout(() => {
      if (ref.current) ref.current.goToPage(2);
    }, 1000);
  }, []);

  return (
    <div className="App">
      <FullPageSnap
        ref={ref}
        speedUp={500}
        speedDown={1000}
        initialPage={(page) => console.log(`initial: ${page}`)}
        beforePageChange={(oldPage, newPage) =>
          console.log(`before: ${oldPage}`)
        }
        afterPageChange={(oldPage, newPage) => console.log(`after: ${newPage}`)}
      >
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            style={{
              width: "25px",
              height: "25px",
              backgroundColor: "red",
              cursor: "pointer",
            }}
          >
            {i}
          </div>
        ))}
      </FullPageSnap>
    </div>
  );
}

export default App;
