import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Games from './Games';
import { getGames } from '../api/backend';

// แทนทั้งไฟล์ backend.js ด้วยของปลอม: ทุกฟังก์ชันกลายเป็น jest.fn() ที่เรากำหนดคำตอบได้
jest.mock('../api/backend');

const FAKE_GAMES = [
  { id: 1, title: 'Hades', genre: 'Role-playing', year: 2020, rating: 8.5, poster: null },
  { id: 2, title: 'Stardew Valley', genre: 'Simulator', year: 2016, rating: 8.4, poster: null },
  { id: 3, title: 'Hades II', genre: 'Role-playing', year: 2024, rating: null, poster: null },
];

function renderGames() {
  return render(<MemoryRouter><Games /></MemoryRouter>);
}

test('loads games and displays genre filters from IGDB results', async () => {
  getGames.mockImplementation(query => Promise.resolve(query ? [FAKE_GAMES[1]] : FAKE_GAMES));
  renderGames();

  expect(await screen.findByText('Hades')).toBeInTheDocument();
  expect(screen.getAllByRole('link')).toHaveLength(3);
  expect(screen.getByRole('button', { name: 'Role-playing' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Simulator' })).toBeInTheDocument();
});

test('search sends the query to the Go API', async () => {
  const user = userEvent.setup();
  getGames.mockImplementation(query => Promise.resolve(query ? [FAKE_GAMES[1]] : FAKE_GAMES));
  renderGames();
  await screen.findByText('Hades');

  await user.type(screen.getByPlaceholderText(/ค้นหาชื่อเกม/), 'stardew');

  expect(await screen.findByText('Stardew Valley')).toBeInTheDocument();
  await waitFor(() => expect(getGames).toHaveBeenLastCalledWith('stardew'));
});

test('backend ล่ม ต้องเห็นข้อความ error และปุ่มลองใหม่ที่โหลดอีกครั้งได้', async () => {
  const user = userEvent.setup();
  getGames
    .mockRejectedValueOnce(new Error('server ไม่ได้ตอบเป็น JSON'))   // ครั้งแรกพัง
    .mockResolvedValueOnce(FAKE_GAMES);
  renderGames();

  expect(await screen.findByText('โหลดข้อมูลไม่สำเร็จ')).toBeInTheDocument();
  expect(screen.getByText('server ไม่ได้ตอบเป็น JSON')).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'ลองใหม่' }));

  expect(await screen.findByText('Hades')).toBeInTheDocument();
  expect(getGames).toHaveBeenCalledTimes(2);
});

test('ผลลัพธ์ว่างต้องแสดง empty state แทน grid เปล่า', async () => {
  getGames.mockResolvedValue([]);
  renderGames();
  expect(await screen.findByText(/ไม่พบเกมที่ค้นหา/)).toBeInTheDocument();
});
