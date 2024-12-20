import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { db, auth } from '../firebase';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Button, Modal, Input, List, Avatar, Typography, Space, Popconfirm } from 'antd';
import { PlusOutlined, CommentOutlined } from '@ant-design/icons';
import Header from '../components/Header';
import "./css/Forum.css";

const { Title, Text } = Typography;

function Forum() {
  const [forums, setForums] = useState([]);
  const [newForumTitle, setNewForumTitle] = useState('');
  const [newForumContent, setNewForumContent] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    const fetchForums = async () => {
      try {
        // Try to get cached forums data
        const cachedForums = localStorage.getItem('forumsData');
        const cachedTimestamp = localStorage.getItem('forumsTimestamp');
        const currentTime = new Date().getTime();
        
        // Check if cache exists, is valid JSON, and is less than 5 minutes old
        if (cachedForums && cachedTimestamp) {
          try {
            const parsedForums = JSON.parse(cachedForums);
            if ((currentTime - parseInt(cachedTimestamp)) < 300000 && Array.isArray(parsedForums)) {
              setForums(parsedForums);
              return;
            }
          } catch (parseError) {
            // Invalid JSON in cache, clear it
            localStorage.removeItem('forumsData');
            localStorage.removeItem('forumsTimestamp');
          }
        }
        
        // Fetch fresh data if cache is invalid, old, or doesn't exist
        const querySnapshot = await getDocs(collection(db, 'forums'));
        const forumsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setForums(forumsData);
        
        // Update cache with fresh data
        try {
          localStorage.setItem('forumsData', JSON.stringify(forumsData));
          localStorage.setItem('forumsTimestamp', currentTime.toString());
        } catch (storageError) {
          // Handle localStorage quota exceeded or other storage errors
          console.warn('Failed to cache forums data:', storageError);
        }
      } catch (error) {
        console.error('Error fetching forums:', error);
        // If there's an error fetching fresh data, try to use cached data regardless of age
        try {
          const cachedForums = localStorage.getItem('forumsData');
          if (cachedForums) {
            const parsedForums = JSON.parse(cachedForums);
            if (Array.isArray(parsedForums)) {
              setForums(parsedForums);
            }
          }
        } catch (fallbackError) {
          console.error('Failed to load cached forums as fallback:', fallbackError);
        }
      }
    };
    
    fetchForums();

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUser(user.uid);
      } else {
        setCurrentUser(null);
      }
    });
    return unsubscribe;
  }, []);

  const handlePostForum = async () => {
    if (newForumTitle.trim() !== '' && newForumContent.trim() !== '') {
      try {
        const newForum = {
          title: newForumTitle,
          content: newForumContent,
          comments: [],
          postedBy: currentUser,
          authorName: auth.currentUser.displayName || 'Anonymous',
          authorAvatar: auth.currentUser.photoURL || 'https://via.placeholder.com/50',
          createdAt: new Date().toISOString(),
        };
        const docRef = await addDoc(collection(db, 'forums'), newForum);
        const updatedForum = { ...newForum, id: docRef.id };
        const updatedForums = [...forums, updatedForum];
        setForums(updatedForums);
        
        // Update cache with new forum
        try {
          localStorage.setItem('forumsData', JSON.stringify(updatedForums));
          localStorage.setItem('forumsTimestamp', new Date().getTime().toString());
        } catch (storageError) {
          console.warn('Failed to update cache after posting:', storageError);
        }
        
        setNewForumTitle('');
        setNewForumContent('');
        setShowModal(false);
      } catch (error) {
        console.error('Error posting forum:', error);
        alert('Failed to post forum. Please try again.');
      }
    }
  };

  const handleDeleteForum = async (id) => {
    if (currentUser) {
      try {
        const forumRef = doc(db, 'forums', id);
        const forumData = forums.find((forum) => forum.id === id);
        if (forumData.postedBy === currentUser) {
          await deleteDoc(forumRef);
          const updatedForums = forums.filter((forum) => forum.id !== id);
          setForums(updatedForums);
          
          // Update cache after deletion
          try {
            localStorage.setItem('forumsData', JSON.stringify(updatedForums));
            localStorage.setItem('forumsTimestamp', new Date().getTime().toString());
          } catch (storageError) {
            console.warn('Failed to update cache after deletion:', storageError);
          }
        } else {
          alert('You do not have permission to delete this forum.');
        }
      } catch (error) {
        console.error('Error deleting forum:', error);
        alert('Failed to delete forum. Please try again.');
      }
    } else {
      alert('Please log in to delete this forum.');
    }
  };

  const TOOL_BAR_OPTIONS = [
    ['bold', 'italic', 'underline'],
    [{ list: 'ordered' }, { list: 'bullet' }],
  ];

  const modules = {
    toolbar: {
      container: TOOL_BAR_OPTIONS,
    },
  };

  const adjustModalHeight = () => {
    if (modalRef.current) {
      const contentHeight = modalRef.current.querySelector('.ql-editor').scrollHeight;
      modalRef.current.style.height = `${contentHeight + 200}px`; // Adjust the height based on content
    }
  };

  return (
    <div style={{ minHeight: '100vh', overflow: 'auto' }}>
      <Header />  
      <div style={{ maxWidth: '700px', margin: '0 auto', marginTop:'-30px', }}>
        <div style={{ padding: '0px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '-10px', marginTop: '10px' }}>
          <Title level={2} style={{ textAlign: 'center', fontWeight: 'bold' }}>Forums</Title>
          <Button style={{ marginTop: '10px' }} type="primary" icon={<PlusOutlined />} onClick={() => setShowModal(true)}>
            Create New Forum
          </Button>
        </div>
        <Modal
          title="Create New Forum"
          open={showModal}
          onCancel={() => setShowModal(false)}
          width={1000}
          footer={[
            <Button key="back" onClick={() => setShowModal(false)}>
              Cancel
            </Button>,
            <Button key="submit" type="primary" onClick={handlePostForum}>
              Post
            </Button>,
          ]}
          ref={modalRef}
          style={{
            overflowY: 'hidden',
            scrollbarWidth: 'thin',
            scrollbarColor: '#ccc #f5f5f5',
            borderRadius: '8px',
            margin:'0 auto',
          }}
        >
          <div style={{ height: 'calc(100vh - 300px)', overflowY: 'auto'}}>
            <Input
              placeholder="Title of your forum"
              value={newForumTitle}
              onChange={(e) => setNewForumTitle(e.target.value)}
              style={{ marginBottom: '1rem', fontWeight: 'bold' }}
            />
            <ReactQuill
              modules={modules}
              value={newForumContent}
              onChange={(content) => {
                setNewForumContent(content);
                adjustModalHeight();
              }}
              placeholder="Content of your forum"
              style={{ height: 'calc(86vh - 300px)', marginBottom: '2rem' }}
              className='ql-modal'
            />
          </div>
        </Modal>
        <List
          itemLayout="vertical"
          dataSource={forums}
          renderItem={(forum) => (
            <List.Item
              style={{
                backgroundColor: 'white',
                borderRadius: '0px',
                marginTop: '0px',
                padding: '1rem',
                display: 'flex',
              }}
              actions={
                currentUser && forum.postedBy === currentUser
                  ? [
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', marginLeft: 'auto' }}>
                      <Popconfirm
                        title="Delete Forum"
                        description="Are you sure to delete this forum?"
                        onConfirm={() => handleDeleteForum(forum.id)}
                        okText="Yes"
                        cancelText="No"
                      >
                        <Button danger size="small">Delete</Button>
                      </Popconfirm>
                    </div>
                  ]
                  : []
              }>

              <List.Item.Meta
                avatar={<Avatar style={{ width: '50px', height: '50px' }} src={forum.authorAvatar} />}
                title={
                  <Link to={`/forum/${forum.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{ marginBottom: '-14px', marginTop: '-6px' }}>
                      <Text strong style={{ fontSize: '20px'}}>{forum.title}</Text>
                    </div>
                  </Link>
                }
                description={
                  <Space direction="vertical">
                    <div>
                      <Text type="secondary" style={{ fontSize: '14px' }}>Posted by: {forum.authorName}</Text>
                    </div>
                    <div style={{ marginTop: '-10px' }}>
                      <Text type="secondary" style={{ fontSize: '12px' }}>{new Date(forum.createdAt).toLocaleString()}</Text>
                    </div>
                    <div style={{ marginTop: '0.5rem', marginBottom: '-1rem' }}>
                      <CommentOutlined style={{ marginRight: '0.5rem' }} />
                      <Text type="secondary">{forum.comments.length} comments</Text>
                    </div>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </div>
    </div>
  );
}

export default Forum;