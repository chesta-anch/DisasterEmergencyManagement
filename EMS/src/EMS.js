import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Button, ScrollView, Alert, ToastAndroid, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';

export default function EMS() {
  const route = useRoute();
  const userType = route.params;
  const [isAdmin] = userType === 'admin' ? useState(true) : useState(false); // Set this based on your authentication logic
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [requests, setRequests] = useState([]); // For storing requests
  const [requestGenerated, setRequestGenerated] = useState(false);
  const [canCancelRequest, setCanCancelRequest] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [notification, setNotification] = useState(null);
  const [cancelTimeout, setCancelTimeout] = useState(null);
  const [userName] = useState('John Doe'); // Assuming userName is "John Doe"

  // Handle selection of an issue
  const handleSelectIssue = (issue) => {
    setSelectedIssue(issue);
    const userAlertMessage = `${issue} alert generated by ${userName}. ${userName} needs assistance.`;
    const timestamp = new Date().toLocaleTimeString();

    if (isAdmin) {
      // For admin, add request to the list
      setRequests(prevRequests => [
        ...prevRequests,
        { issue, time: timestamp, userName }
      ]);
      setChatHistory(prevHistory => [
        ...prevHistory,
        { sender: 'user', text: userAlertMessage, time: timestamp }
      ]);
    } else {
      // For regular users
      setChatHistory(prevHistory => [
        ...prevHistory,
        { sender: 'user', text: userAlertMessage, time: timestamp }
      ]);
      setRequestGenerated(true);
      setCanCancelRequest(true); // Enable cancel option
      setTimeLeft(300); // Reset timer
      showNotification(`${issue} EMS request generated.`);
      startCountdown();
    }

    // Simulate a bot response
    setTimeout(() => {
      setChatHistory(prevHistory => [
        ...prevHistory,
        { sender: 'bot', text: `We have received your message regarding ${issue}. We will assist you shortly.`, time: new Date().toLocaleTimeString() }
      ]);
    }, 1000);
  };

  // Cancel the request
  const handleCancelRequest = () => {
    Alert.alert(
      'Cancel Request',
      `Are you sure you want to cancel the request for ${selectedIssue}?`,
      [
        { text: 'No' },
        {
          text: 'Yes',
          onPress: () => {
            if (isAdmin) {
              // Admin cancels the request
              setRequests(prevRequests => prevRequests.filter(req => req.issue !== selectedIssue));
              setChatHistory(prevHistory => [
                ...prevHistory,
                { sender: 'user', text: `Request for ${selectedIssue} cancelled.`, time: new Date().toLocaleTimeString() },
                { sender: 'bot', text: `Request cancelled successfully.`, time: new Date().toLocaleTimeString() }
              ]);
            } else {
              // Regular user cancels the request
              setChatHistory(prevHistory => [
                ...prevHistory,
                { sender: 'user', text: `Request for ${selectedIssue} cancelled.`, time: new Date().toLocaleTimeString() },
                { sender: 'bot', text: `Request cancelled successfully.`, time: new Date().toLocaleTimeString() }
              ]);
              setRequestGenerated(false);
              setCanCancelRequest(false);
              if (cancelTimeout) {
                clearTimeout(cancelTimeout);
              }
              setTimeLeft(300); // Reset the timer for future requests
              showNotification('Request cancelled successfully.');
              setSelectedIssue(null); // Reset selected issue
            }
          }
        }
      ]
    );
  };

  // Send a message
  const handleSendMessage = () => {
    if (message.trim() === '') return;

    const timestamp = new Date().toLocaleTimeString();

    setChatHistory(prevHistory => [
      ...prevHistory,
      { sender: 'user', text: message, time: timestamp }
    ]);
    setMessage('');

    if (requestGenerated) {
      setTimeout(() => {
        setChatHistory(prevHistory => [
          ...prevHistory,
          { sender: 'bot', text: `We have received your message regarding ${selectedIssue}. We will assist you shortly.`, time: new Date().toLocaleTimeString() }
        ]);
      }, 1000);
    }
  };

  // Notify user with Toast message
  const notifyUser = (message) => {
    ToastAndroid.showWithGravity(
      message,
      ToastAndroid.SHORT,
      ToastAndroid.CENTER
    );
  };

  // Start countdown for cancellation
  const startCountdown = () => {
    setCancelTimeout(
      setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            clearInterval(cancelTimeout);
            setCanCancelRequest(false);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000)
    );
  };

  // Show notification at the top
  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => {
      setNotification(null);
    }, 20000); // Show notification for 20 seconds
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (cancelTimeout) {
        clearTimeout(cancelTimeout);
      }
    };
  }, [cancelTimeout]);

  // Format time left for display
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  return (
    <View style={styles.container}>
      {notification && (
        <View style={styles.notification}>
          <Text style={styles.notificationText}>{notification}</Text>
        </View>
      )}

      {isAdmin ? (
        <View style={styles.adminContainer}>
          <FlatList
            data={requests}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={styles.requestItem}>
                <Text style={styles.requestText}>{item.issue} - {item.userName} - {item.time}</Text>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => handleCancelRequest()}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </View>
      ) : (
        <View style={styles.chatContainer}>
          <ScrollView style={styles.chatHistory}>
            {chatHistory.map((chat, index) => (
              <View
                key={index}
                style={[
                  styles.chatBubble,
                  chat.sender === 'user' ? styles.userBubble : styles.botBubble
                ]}
              >
                <Text style={styles.chatText}>{chat.text}</Text>
                <Text style={styles.chatTime}>{chat.time}</Text>
              </View>
            ))}
          </ScrollView>

          {!selectedIssue && (
            <View style={styles.issueSelectionContainer}>
              <Text style={styles.issueSelectionText}>Select an issue to generate a request:</Text>
              <TouchableOpacity
                style={styles.issueButton}
                onPress={() => handleSelectIssue('Vehicle Breakdown')}
              >
                <Ionicons name="car-outline" size={24} color="#fff" />
                <Text style={styles.buttonText}>Vehicle Breakdown</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.issueButton}
                onPress={() => handleSelectIssue('Accident/Fire')}
              >
                <Ionicons name="flame-outline" size={24} color="#fff" />
                <Text style={styles.buttonText}>Accident/Fire</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.issueButton}
                onPress={() => handleSelectIssue('Medical')}
              >
                <Ionicons name="medkit-outline" size={24} color="#fff" />
                <Text style={styles.buttonText}>Medical</Text>
              </TouchableOpacity>
            </View>
          )}

          {selectedIssue && (
            <>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Type your message"
                  value={message}
                  onChangeText={setMessage}
                  editable={requestGenerated} // Enable input only when a request is generated
                />
                <Button title="Send" onPress={handleSendMessage} disabled={!requestGenerated} />
              </View>
              {canCancelRequest && (
                <View style={styles.cancelContainer}>
                  <Text style={styles.timerText}>Time left to cancel: {formatTime(timeLeft)}</Text>
                  <Button title="Cancel Request" onPress={handleCancelRequest} color="#c23b22" />
                </View>
              )}
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#add8e6',
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  notification: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'green',
    padding: 10,
    zIndex: 10,
  },
  notificationText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  chatContainer: {
    flex: 1,
    marginTop: 20,
  },
  adminContainer: {
    flex: 1,
    marginTop: 20,
  },
  requestItem: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  requestText: {
    fontSize: 16,
  },
  cancelButton: {
    marginTop: 10,
    backgroundColor: '#c23b22',
    padding: 10,
    borderRadius: 5,
  },
  cancelButtonText: {
    color: '#fff',
    textAlign: 'center',
  },
  chatHistory: {
    flex: 1,
    marginBottom: 10,
  },
  chatBubble: {
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  userBubble: {
    backgroundColor: '#126180',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 0,
  },
  botBubble: {
    backgroundColor: '#f1f1f1',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 0,
  },
  chatText: {
    color: '#fff',
  },
  chatTime: {
    fontSize: 10,
    color: '#999',
    marginTop: 5,
    textAlign: 'right',
  },
  issueSelectionContainer: {
    marginTop: 10,
  },
  issueSelectionText: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
    color: '#333',
  },
  issueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#126180',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    marginLeft: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  input: {
    flex: 1,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginRight: 10,
  },
  cancelContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  timerText: {
    color: '#333',
    fontSize: 14,
    marginBottom: 5,
  },
});
