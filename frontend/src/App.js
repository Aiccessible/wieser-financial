import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Authenticator } from "@aws-amplify/ui-react";
import Protected from './pages/Protected';
import Login from './pages/Login';
import Institution from './pages/Institution';
import Layout from './components/Layout';
import RequireAuth from './RequireAuth';
import Profile from './components/Profile';

import './App.css';
import Transactions from './components/Transactions';
import Investments from './components/Investments';
import Accounts from './components/Accounts';
import Projection from './components/Analysis/Projection'
import RootLayout from './RootLayout';
import AnalyzeRecommendation from './components/Analysis/AnalyzeRecommendation'
import * as Highcharts from 'highcharts'
import useColorMode from './hooks/useColorMode';
import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from './store'

try {
    Highcharts.setOptions({
        colors: Highcharts.map(Highcharts.getOptions().colors ?? [], function (color) {
            return {
                radialGradient: {
                    cx: 0.5,
                    cy: 0.3,
                    r: 0.7,
                },
                stops: [
                    [0, color],
                    [1, Highcharts.color(color).brighten(-0.3).get('rgb')], // darken
                ],
            }
        }),
    })
} catch (e) {
    console.error('No colors')
}

console.log(process.env.REACT_APP_BACKEND_URL,'1234')

const darkTheme = {
    chart: {
        backgroundColor: '#122011',
        style: {
            fontFamily: 'sans-serif',
        },
    },
    title: {
        style: {
            color: '#ffffff',
        },
    },
    xAxis: {
        gridLineColor: '#444444',
        lineColor: '#444444',
        tickColor: '#444444',
        labels: {
            style: {
                color: '#cccccc',
            },
        },
        title: {
            style: {
                color: '#ffffff',
            },
        },
    },
    yAxis: {
        gridLineColor: '#444444',
        lineColor: '#444444',
        tickColor: '#444444',
        labels: {
            style: {
                color: '#cccccc',
            },
        },
        title: {
            style: {
                color: '#ffffff',
            },
        },
    },
    tooltip: {
        backgroundColor: '#333333',
        style: {
            color: '#ffffff',
        },
    },
    legend: {
        backgroundColor: 'transparent',
        itemStyle: {
            color: '#ffffff',
        },
        itemHoverStyle: {
            color: '#dddddd',
        },
    },
    plotOptions: {
        series: {
            dataLabels: {
                color: '#ffffff',
            },
            marker: {
                lineColor: '#333333',
            },
        },
        boxplot: {
            fillColor: '#505053',
        },
        candlestick: {
            lineColor: 'white',
        },
        errorbar: {
            color: 'white',
        },
    },
    credits: {
        style: {
            color: '#666666',
        },
    },
    labels: {
        style: {
            color: '#ffffff',
        },
    },
}

function App() {
    const [colorMode] = useColorMode()
    useEffect(() => {
        if (colorMode === 'dark') {
            Highcharts.setOptions(darkTheme)
        }
    }, [colorMode])
  return (
      <Authenticator.Provider>
          <Provider store={store}>
              <BrowserRouter>
                  <Routes>
                      <Route path="/" element={<Layout />}>
                          <Route index element={<Navigate to="/institution/v0/transactions" replace />} />
                          <Route
                              path="/institutions"
                              index
                              element={
                                  <RequireAuth>
                                      <RootLayout>
                                          <Protected />
                                      </RootLayout>
                                  </RequireAuth>
                              }
                          />
                          <Route
                              path="/institution/:id/transactions"
                              element={
                                  <RequireAuth>
                                      <RootLayout>
                                          <Transactions />
                                      </RootLayout>
                                  </RequireAuth>
                              }
                          />
                          <Route
                              path="/analyze/:id/"
                              element={
                                  <RequireAuth>
                                      <RootLayout>
                                          <Projection />
                                      </RootLayout>
                                  </RequireAuth>
                              }
                          />
                          <Route
                              path="/institution/:id/investments"
                              element={
                                  <RequireAuth>
                                      <RootLayout>
                                          <Investments />
                                      </RootLayout>
                                  </RequireAuth>
                              }
                          />
                          <Route
                              path="/institution/:id/accounts"
                              element={
                                  <RequireAuth>
                                      <RootLayout>
                                          <Accounts updateAccounts={() => {}} />
                                      </RootLayout>
                                  </RequireAuth>
                              }
                          />
                          <Route
                              path="/institution/:id"
                              element={
                                  <RequireAuth>
                                      <RootLayout>
                                          <Institution />
                                      </RootLayout>
                                  </RequireAuth>
                              }
                          />
                          <Route
                              path={`/institution/:id/analyze/recommendation/:name`}
                              element={
                                  <RequireAuth>
                                      <RootLayout>
                                          <AnalyzeRecommendation />
                                      </RootLayout>
                                  </RequireAuth>
                              }
                          />
                          <Route
                              path="/profile"
                              element={
                                  <RequireAuth>
                                      <RootLayout>
                                          <Profile />
                                      </RootLayout>
                                  </RequireAuth>
                              }
                          />
                          <Route path="/login" element={<Login />} />
                      </Route>
                  </Routes>
              </BrowserRouter>
          </Provider>
      </Authenticator.Provider>
  )
}

export default App;
