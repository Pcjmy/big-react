import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';

function App() {
  const [num, setNum] = useState(0);

	useEffect(() => {
		return () => console.log('Unmount parent');
	});

  if (num) {
    return null;
  }

	return (
		<div onClick={() => setNum((num) => num + 1)}>
			<Child />
		</div>
	);
}

function Child() {
	useEffect(() => {
		return () => console.log('Unmount child');
	});
	return 'Child';
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<App />
);
