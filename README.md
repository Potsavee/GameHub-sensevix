# GameHub-sensevix
โปรเจกต์ GameReview จัดทำขึ้นเป็น Term Project สำหรับรายวิชา BE-FE เพื่อประยุกต์ใช้ความรู้ด้านการพัฒนา Frontend และ Backend เข้าด้วยกัน โดยพัฒนาเว็บสำหรับค้นหาและรีวิวเกม

Frontend พัฒนาด้วย React และเรียกใช้งาน Backend ผ่าน Fetch API ส่วน Backend พัฒนาด้วย Go เพื่อจัดการ API การยืนยันตัวตน และการเชื่อมต่อฐานข้อมูล PostgreSQL บน Supabase นอกจากนี้ยังเชื่อมต่อ IGDB API เพื่อนำข้อมูลเกมมาแสดงบนเว็บไซต์

โปรเจกต์นี้ช่วยให้สมาชิกได้ฝึกออกแบบและพัฒนาระบบแบบ Full Stack ตั้งแต่การแสดงผล การรับส่งข้อมูลระหว่าง Frontend และ Backend ไปจนถึงการจัดเก็บและเรียกใช้ข้อมูลจากฐานข้อมูล

# GameReview

เว็บค้นหาและรีวิวเกม ผู้ใช้สามารถดูข้อมูลเกม ค้นหาตามชื่อหรือแนวเกม เขียนรีวิว และบันทึกเกมลง Wishlist ได้

## Tech Stack

- Frontend: React
- Backend: Go (`net/http`)
- Database: PostgreSQL บน Supabase
- Game data: IGDB API
- Deployment: Vercel (Frontend) และ Render (Backend)

## Features

- ค้นหาและเลือกดูเกมตามแนวเกม
- ดูรายละเอียดและภาพตัวอย่างของเกม
- สมัครสมาชิก เข้าสู่ระบบ และเปลี่ยนรหัสผ่าน
- เพิ่มหรือนำเกมออกจาก Wishlist
- สมาชิกเขียนรีวิวเกมได้
- Admin จัดการเกมและสิทธิ์สมาชิก
- API Lab สำหรับดูผลลัพธ์ JSON จาก Go API

## Project Structure

```text
gamebuhhub-fe/frontend/   React frontend
gamehub-be/Backend/gamehub/ Go API
  ├── auth/               จัดการรหัสผ่านและ token
  ├── handler/            HTTP handlers
  ├── middleware/         ตรวจ login และสิทธิ์
  ├── store/              คำสั่งติดต่อฐานข้อมูล
  └── migrations/         SQL migrations
