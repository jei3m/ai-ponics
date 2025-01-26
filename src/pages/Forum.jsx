import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db, auth } from '../firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, limit, orderBy, startAfter } from 'firebase/firestore';
import ReactQuill from 'react-quill-new'; // fork of react-quill since it is no longer maintained
import 'react-quill-new/dist/quill.snow.css';
import { Button, Modal, Input, List, Avatar, Typography, Space, Popconfirm } from 'antd';
import { PlusOutlined, CommentOutlined, DeleteOutlined } from '@ant-design/icons';
import "./css/Forum.css";

const { Title, Text } = Typography;

function Forum() {
  const [forums, setForums] = useState([]);
  const [newForumTitle, setNewForumTitle] = useState('');
  const [newForumContent, setNewForumContent] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastVisible, setLastVisible] = useState(null);

  useEffect(() => {
    let unsubscribeForums;

    const loadForums = async () => {
      setLoading(true);
      let q = query(collection(db, 'forums'), orderBy('createdAt', 'desc'), limit(10));

      unsubscribeForums = onSnapshot(q, (querySnapshot) => {
        const forumsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setForums(forumsData);
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
        setHasMore(querySnapshot.docs.length === 10);
        setLoading(false);
      });
    };

    loadForums();

    // Listen for authentication state changes
    const subscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUser(user.uid);
      } else {
        setCurrentUser(null);
      }
    });

    // Cleanup subscriptions on unmount
    return () => {
      if (unsubscribeForums) {
        unsubscribeForums(); // Unsubscribe from Firestore listener
      }
      subscribeAuth(); // Unsubscribe from auth listener
    };
  }, []);

  const loadMoreForums = async () => {
    if (!hasMore || loading) return;

    setLoading(true);
    let q = query(collection(db, 'forums'), orderBy('createdAt', 'desc'), startAfter(lastVisible), limit(10));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const forumsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setForums((prevForums) => [...prevForums, ...forumsData]);
      setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      setHasMore(querySnapshot.docs.length === 10);
      setLoading(false);
    });

    return unsubscribe;
  };

  const handleScroll = () => {
    if (
      window.innerHeight + document.documentElement.scrollTop >=
      document.documentElement.offsetHeight - 100 && !loading && hasMore
    ) {
      loadMoreForums();
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, hasMore]);

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
        await addDoc(collection(db, 'forums'), newForum);
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

  return (
    <>
      <div className='forum-page-container'>
        <div className='forum-content-container'>
          <div className='forum-title-container'>
            <Title level={2} style={{ textAlign: 'center', fontWeight: 'bold' }}>Forums</Title>
            <Button style={{ marginTop: '10px' }} type="primary" icon={<PlusOutlined />} onClick={() => setShowModal(true)}>
              Create Forum
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
          >
            <div className='forum-create-input-container'>
              <Input
                placeholder="Title of your forum"
                value={newForumTitle}
                onChange={(e) => setNewForumTitle(e.target.value)}
                className='forum-create-input'
              />
              <ReactQuill
                modules={modules}
                value={newForumContent}
                onChange={(content) => {
                  setNewForumContent(content);
                }}
                placeholder="Content of your forum"
                className='ql-modal'
              />
            </div>
          </Modal>
          <List
            itemLayout="vertical"
            dataSource={forums}
            renderItem={(forum) => (
              <List.Item
                className='forum-list-item'
                actions={
                  currentUser && forum.postedBy === currentUser
                    ? [
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Popconfirm
                          title="Delete Forum"
                          description="Are you sure to delete this forum?"
                          onConfirm={() => handleDeleteForum(forum.id)}
                          okText="Yes"
                          cancelText="No"
                        >
                          <DeleteOutlined style={{ color: 'red' }} />
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
                        <Text strong style={{ fontSize: '20px' }}>{forum.title}</Text>
                      </div>
                    </Link>
                  }
                  description={
                    <Space direction="vertical">
                      <div>
                        <Text type="secondary"> Posted by: {forum.authorName}</Text>
                      </div>
                      <div style={{ marginTop: '-10px', marginBottom: '-30px' }}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>{new Date(forum.createdAt).toLocaleString()} | <CommentOutlined /> {forum.comments.length} </Text>
                      </div>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
          {forums.length > 0 && (
            <>
              {loading && <div style={{ textAlign: 'center', marginTop: '20px', color:'gray' }}>Loading...</div>}
              {!hasMore && <div style={{ textAlign: 'center', marginTop: '20px', color:'gray' }}>No more forums to load...</div>}
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default Forum;