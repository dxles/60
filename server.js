const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const SUPABASE_URL = "https://qofeciqfqxrtgprquswn.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvZmVjaXFmcXhydGdwcnF1c3duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NDEzOTQsImV4cCI6MjA3NzQxNzM5NH0.qXMBC3VnXskI3MNl0fqVR5BQEqVrWGVJUuswabZip4o";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

app.use(express.static('public'));
app.use(express.json());

// Oda oluştur ve Supabase'e ekle
app.post('/create-room', async (req, res) => {
    const { data, error } = await supabase
        .from('rooms')
        .insert({})
        .select();
    if(error) return res.status(500).json({error});
    res.json({roomId: data[0].id});
});

// Odaya katılma, sadece var mı kontrol
app.get('/room/:id', async (req, res) => {
    const roomId = req.params.id;
    const { data, error } = await supabase
        .from('rooms')
        .select()
        .eq('id', roomId)
        .single();
    if(error || !data) return res.status(404).send('Oda bulunamadı');
    res.sendFile(__dirname + '/public/room.html');
});

// Socket.io bağlantısı
io.on('connection', socket => {
    socket.on('join-room', roomId => {
        socket.join(roomId);
        socket.to(roomId).emit('user-connected', socket.id);

        socket.on('signal', data => {
            io.to(data.to).emit('signal', { from: socket.id, signal: data.signal });
        });

        socket.on('disconnect', () => {
            socket.to(roomId).emit('user-disconnected', socket.id);
        });
    });
});

server.listen(3000, () => console.log('Sunucu 3000 portunda çalışıyor'));
