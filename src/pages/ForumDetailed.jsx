import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import "./css/Forum.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faComment, faReply, faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import Loading from '../pages/components/Loading';
import { Button, Popconfirm, Avatar } from 'antd';

function DetailedView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [forum, setForum] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [replyInputs, setReplyInputs] = useState({});
  const [showReplies, setShowReplies] = useState({});
  const [showReplyForm, setShowReplyForm] = useState({});

  useEffect(() => {
    const fetchForum = async () => {
      const docRef = doc(db, 'forums', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setForum({ id: docSnap.id, ...docSnap.data() });
      } else {
        console.log("No such document!");
      }
    };
    fetchForum();

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUser(user.uid);
      } else {
        setCurrentUser(null);
      }
    });
    return unsubscribe;
  }, [id]);

  const handleComment = async () => {
    if (newComment.trim() !== '' && forum) {
      const forumRef = doc(db, 'forums', forum.id);
      const newCommentObj = {
        comment: newComment,
        postedBy: currentUser,
        authorName: auth.currentUser.displayName || 'Anonymous',
        authorAvatar: auth.currentUser.photoURL || 'https://via.placeholder.com/50',
        createdAt: new Date().toISOString(),
      };
      await updateDoc(forumRef, {
        comments: arrayUnion(newCommentObj),
      });
      setNewComment('');
      setForum(prevForum => ({
        ...prevForum,
        comments: [...prevForum.comments, newCommentObj],
      }));
    }
  };

  const handleDeleteComment = async (commentIndex) => {
    if (currentUser && forum) {
      const forumRef = doc(db, 'forums', forum.id);
      if (forum.comments[commentIndex].postedBy === currentUser) {
        const updatedComments = forum.comments.filter(
          (_, index) => index !== commentIndex
        );
        await updateDoc(forumRef, { comments: updatedComments });
        setForum(prevForum => ({
          ...prevForum,
          comments: updatedComments,
        }));
      } else {
        alert('You do not have permission to delete this comment.');
      }
    } else {
      alert('Please log in to delete this comment.');
    }
  };

  const handleDeleteReply = async (commentIndex, replyIndex) => {
    if (currentUser && forum) {
      const forumRef = doc(db, 'forums', forum.id);
      if (forum.comments[commentIndex].replies[replyIndex].postedBy === currentUser) {
        const updatedComments = [...forum.comments];
        updatedComments[commentIndex].replies = updatedComments[commentIndex].replies.filter(
          (_, index) => index !== replyIndex
        );
        await updateDoc(forumRef, { comments: updatedComments });
        setForum(prevForum => ({
          ...prevForum,
          comments: updatedComments,
        }));
      } else {
        alert('You do not have permission to delete this reply.');
      }
    } else {
      alert('Please log in to delete this reply.');
    }
  };

  const handleReply = async (commentIndex) => {
    const reply = replyInputs[commentIndex];
    if (reply && reply.trim() !== '' && forum) {
      const forumRef = doc(db, 'forums', forum.id);
      const newReplyObj = {
        comment: reply,
        postedBy: currentUser,
        authorName: auth.currentUser.displayName || 'Anonymous',
        authorAvatar: auth.currentUser.photoURL || 'https://via.placeholder.com/50',
        createdAt: new Date().toISOString(),
      };
      const updatedComments = [...forum.comments];
      updatedComments[commentIndex].replies = updatedComments[commentIndex].replies || [];
      updatedComments[commentIndex].replies.push(newReplyObj);
      await updateDoc(forumRef, { comments: updatedComments });
      setForum(prevForum => ({
        ...prevForum,
        comments: updatedComments,
      }));
      setReplyInputs(prev => ({ ...prev, [commentIndex]: '' }));
      setShowReplyForm(prev => ({ ...prev, [commentIndex]: false }));
    }
  };

  const toggleReplies = (commentIndex) => {
    setShowReplies(prev => ({
      ...prev,
      [commentIndex]: !prev[commentIndex],
    }));
  };

  const toggleReplyForm = (commentIndex) => {
    setShowReplyForm(prev => ({
      ...prev,
      [commentIndex]: !prev[commentIndex],
    }));
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

  if (!forum) return <div><Loading/></div>;

  return (
    <div>
      <div className="forum-container">
        <div className="detailed-view">
          <h1 className="forum-title">{forum.title}</h1>
          <p className="forum-author">Posted by: {forum.authorName}</p>
          <p className="forum-date">Created on: {new Date(forum.createdAt).toLocaleString()}</p>
          <div className="forum-content" dangerouslySetInnerHTML={{ __html: forum.content }} />

          <h3 style={{marginTop:'100px', marginBottom:'-10px'}}>Comments:</h3>
          <div className="comment-input">
            <ReactQuill
              modules={modules}
              value={newComment}
              onChange={setNewComment}
              placeholder="Comment on this forum"
              className='ql-comment'
              style={{minHeight:'10em'}}
            />
            <div className='button-group'> 
              <button onClick={() => navigate('/forum')} className="button-back"><FontAwesomeIcon icon={faArrowLeft}/> Back</button>
              <button onClick={handleComment} className="forum-button-detailed"><FontAwesomeIcon icon={faComment}/> Comment</button>
            </div>
          </div>
          <ul className="comment-list">
            {forum.comments.map((comment, index) => (
              <li key={index} className="comment-item">
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                  <Avatar style={{ width: '40px', height: '40px', marginRight: '10px' }} src={comment.authorAvatar} />
                  <div>
                    <p className="comment-author">{comment.authorName}</p>
                    <p className="comment-date">{new Date(comment.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <div className="comment-text" dangerouslySetInnerHTML={{ __html: comment.comment }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>  
                    <Button
                      className='forum-button'
                      type="normal"
                      onClick={() => toggleReplyForm(index)}
                      icon={showReplyForm[index] ? <FontAwesomeIcon icon={faChevronUp} /> : <FontAwesomeIcon icon={faReply} />}
                    >
                      {showReplyForm[index] ? 'Cancel Reply' : 'Reply'}
                    </Button>
                    {comment.replies && comment.replies.length > 0 && (
                      <Button
                        className="forum-button"
                        type="normal"
                        onClick={() => toggleReplies(index)}
                        icon={showReplies[index] ? <FontAwesomeIcon icon={faChevronUp} /> : <FontAwesomeIcon icon={faChevronDown} />}
                      >
                        {showReplies[index] ? 'Hide Replies' : 'Show Replies'}
                      </Button>
                    )}
                  </div>
                  {currentUser && comment.postedBy === currentUser && (
                    <Popconfirm
                      title="Delete Comment"
                      description="Are you sure to delete this comment?"
                      onConfirm={() => handleDeleteComment(index)}
                      okText="Yes"
                      cancelText="No"
                    >
                      <Button danger size="small">Delete</Button>
                    </Popconfirm>
                  )}
                </div>
                {showReplyForm[index] && (
                  <div className="reply-input">
                    <ReactQuill
                      modules={modules}
                      value={replyInputs[index] || ''}
                      onChange={(value) => setReplyInputs({ ...replyInputs, [index]: value })}
                      placeholder="Reply to this comment"
                      className='ql-comment'
                      style={{minHeight:'5em'}}
                    />
                    <Button className='forum-button' onClick={() => handleReply(index)} style={{marginTop:'10px', display:'flex', marginLeft:'auto'}}><FontAwesomeIcon icon={faReply}/> Submit Reply</Button>
                  </div>
                )}
                {showReplies[index] && comment.replies && comment.replies.length > 0 && (
                  <ul className="reply-list">
                    {comment.replies.map((reply, replyIndex) => (
                      <li key={replyIndex} className="reply-item">
                        <div style={{display:'flex', alignItems:'flex-start'}}>    
                          <Avatar style={{width:'36px', height:'36px', marginRight:'10px'}} src={reply.authorAvatar} />
                          <div>
                            <p className="reply-author">{reply.authorName}</p>
                            <p className="reply-date">{new Date(reply.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="comment-text" dangerouslySetInnerHTML={{ __html: reply.comment }} />
                        {currentUser && reply.postedBy === currentUser && (
                          <div style={{display:'flex', justifyContent:'right', marginTop:'-1rem'}}>
                            <Popconfirm
                              title="Delete Reply"
                              description="Are you sure to delete this reply?"
                              onConfirm={() => handleDeleteReply(index, replyIndex)}
                              okText="Yes"
                              cancelText="No"
                            >
                              <Button danger size="small">Delete</Button>
                            </Popconfirm>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default DetailedView;