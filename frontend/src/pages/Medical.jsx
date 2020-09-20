import React, {useState, useEffect} from 'react';
import SymptomLog from '../components/medical/SymptomLog';
import {Grid,Typography, makeStyles, Box, Divider, GridList, Card, CardContent, Button} from '@material-ui/core';
import { useCookies } from 'react-cookie';
import axios from 'axios'
import { URL } from "../constants.js";

import Image from '../assets/background.svg';
import { useHistory } from 'react-router-dom';

const useStyles = makeStyles((theme) => ({
    container: {
        height: '230vh',
        maxWidth: '100vw',
        padding: '2rem 2rem 2rem 2rem',
        [theme.breakpoints.down('lg')]: {
        padding: '1rem 1rem 1rem 1rem'
        },
        backgroundImage: `url(${Image})`,
    },
    greetingsContainer: {
        boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
        background: '#9066FF',
        padding: '1rem 3rem',
        borderRadius: '4px',
        color: '#fff',
    },
    communityContainer: {
      boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
      background: '#ced6e0',
      padding: '1rem 3rem',
      borderRadius: '4px',
      color: '#fff',
      width: '450px',
      display: 'flex',
      flex: 'row',
      justifyContent: 'space-between'
  },
    submitBtn: {
      maxHeight: '70px',
      maxWidth: '70px',
      backgroundColor: '#47C594',
      color: '#fff',
      textTransform: 'none',
      fontSize: '40px'
  },
}));

const Medical = (props) => {
    const classes = useStyles();
    const history = useHistory();
    const {
        user
    } = props;
    const [text, setText] = useState('');
    const [token, setToken] = useCookies(['auth_token']);

    const [isLoading, setIsLoading] = useState(false);
    const [illness, setIllness] = useState([])
    const [community, setCommunity] = useState([])
    const [yourCommunity, setYourCommunity] = useState([])

    const onCommunityClick = () => {
        history.push('/community');
    }

    useEffect(async () => {
        if (!token.auth_token) {
            history.push('/login');
        }
        const username = localStorage.getItem('username')

        const result = await axios.get(URL+"/users/"+username, 
        {
          headers: {
            Authorization: token.auth_token

          }
        })
        const currentCommunity = []
        if(result.data && result.data.communities) {
          for(const co of result.data.communities) {
            const current = await axios.get(URL+"/communities/"+co, 
            {
              headers: {
                Authorization: token.auth_token

              }
            })
            currentCommunity.push(current.data)
          }

        }
        setYourCommunity(currentCommunity)
    }, [])

    const onChange = (e) => {        
        setText(e.target.value)
    }

    const onClick = async (e) => {
        setIsLoading(true);
        setIllness([]);
        const fetchResult = await fetchData(text);
        setIsLoading(false);

        if(fetchResult) {
          setIllness(fetchResult.conditions)
          const currentCommunities = []
          for(const item of fetchResult.conditions) {
            let itemExists = await axios.get(URL+"/communities/find/"+item.name, 
            {
              headers: {
                Authorization: token.auth_token
              }
            });

            if(itemExists.data){
              currentCommunities.push(itemExists.data)
            }else{
              let itemExists = await axios.post(URL+"/communities/", 
              {
                name: item.name,
                description: 'This is a Community for people with Acute bronchitis'+item.name
              },
              {
                
                headers: {
                  Authorization: token.auth_token
                }
              })
              itemExists = await axios.get(URL+"/communities/find/"+item.name, 
              {
                headers: {
                  Authorization: token.auth_token
                }
              });
              currentCommunities.push(itemExists.data)
            }
          }
          setCommunity(currentCommunities)
        }
    }

    const fetchData = async (text) => {
        try {
            const result = await axios.post("https://api.infermedica.com/v2/parse", 
              {
                text
              },
              {
                headers: {
                  'App-Id': process.env.REACT_APP_ZAPI_APP_ID,
                  'App-Key': process.env.REACT_APP_API_APP_KEY,
                  'Content-Type': 'application/json'
                }
              })
        
            const parseResult = result.data;
            if (parseResult.mentions) {
            }
            const evidence = parseResult.mentions.map(item => {
              return {
                id: item.id,
                choice_id: item.choice_id,
              }
            })
        
            const diagnosisResult = await axios.post("https://api.infermedica.com/v2/diagnosis", 
              {
                sex: 'female',
                age: 25,
                evidence
              },
              {
                headers: {
                  'App-Id': process.env.REACT_APP_ZAPI_APP_ID,
                  'App-Key': process.env.REACT_APP_API_APP_KEY,
                  'Content-Type': 'application/json'
                }
              })
            return diagnosisResult.data
          } catch (e){
            return 
          }
    }

    const addCommunity = communityID => async () => {
      for(const item of yourCommunity) {
        if (communityID === item.id) {
          console.log('no')
          return
        }
      }
      const username = localStorage.getItem('username')
      const result = await axios.put(URL+"/users/"+ username, 
      {
        communities: [communityID]
      },
      {
        headers: {
          'App-Id': process.env.REACT_APP_ZAPI_APP_ID,
          'App-Key': process.env.REACT_APP_API_APP_KEY,
          'Content-Type': 'application/json'
        }
      })
    }

    return (
        <div className = {classes.container}>
            <Grid container direction = 'row' spacing = {2} justify = 'center' alignItems = 'stretch' alignContent = 'stretch'>
                <Grid item xs = {12} md = {6} lg = {7} xl = {7} style = {{marginLeft: '1ren', marginTop: '1rem', height: '80vmin'}}>
                    <Grid container direction = 'column' spacing = {3}>
                        <Grid item>
                            <div className = {classes.greetingsContainer}>
                                <Typography variant = 'h5'><Box fontWeight = 'bold'>Welcome to Meddit, {localStorage.getItem('username')} </Box></Typography>
                                <Typography variant = 'subtitle2' style = {{opacity: '.7'}}>Please enter how you are feeling so we can add you to a community of people who feel the same way</Typography>
                            </div>
                        </Grid> 
                        <Grid item>
                            <SymptomLog onChange={onChange} onClick={onClick}
                                isLoading={isLoading} illness={illness}
                            ></SymptomLog>
                        </Grid>
                        <Grid item>
                            <Typography variant = 'h6'><Box fontWeight = 'bold'>Some Communities You might want to Join</Box></Typography>
                        </Grid>
                        <Grid item>
                            <GridList cols = {3} spacing = {1} cellHeight = 'auto'>

                            </GridList>
                        </Grid>
                        {
                          community.map(item =>{
                            const communityID = Object.keys(item)[0]
                            const info = item[communityID];
                            return (
                            <div key={info.name} className = {classes.communityContainer}>
                              <div>
                              <Typography variant ='h6'><Box fontWeight = 'bold'>{info.name}</Box></Typography>
                              <Typography variant = 'subtitle2' style = {{opacity: '.7'}}>This is a Community for people with {item.name} </Typography>
                              </div>

                              <Button onClick={addCommunity(communityID)} size = 'small' className = {classes.submitBtn}>+</Button>

                            </div>)
                            })
                        }
                        <Grid item>
                            <Typography variant = 'h6'><Box fontWeight = 'bold'>Your communities</Box></Typography>
                        </Grid>
                        <Grid item>
                            <GridList cols = {3} spacing = {1} cellHeight = 'auto'>

                            </GridList>
                        </Grid>
                        {
                          yourCommunity.map(item =>{
                            return (
                            <div key={item.name} className = {classes.communityContainer}>
                              <div>
                              <Typography variant ='h6'><Box fontWeight = 'bold'>{item.name}</Box></Typography>
                              <Typography variant = 'subtitle2' style = {{opacity: '.7'}}>This is a Community for people with {item.name} </Typography>
                              </div>

                            </div>)
                            })
                        }
                    </Grid>
                </Grid>
            </Grid>
        </div>
    )
}

export default Medical;
