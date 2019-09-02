module FsTests exposing (fsTests)

import Expect
import Os exposing (..)
import Test exposing (..)


dir : Fs
dir =
    Dir
        ( "/"
        , [ File ( "root.txt", 0 )
          , Dir
                ( "usr"
                , [ Dir
                        ( "bin"
                        , [ File ( "echo", 1 )
                          ]
                        )
                  ]
                )
          ]
        )


fsTests : Test
fsTests =
    describe "test Os module"
        [ describe "getFromAbsPath"
            [ test "root" <|
                \_ -> Expect.equal (getFromAbsPath [ "/" ] dir) (Just dir)
            , test "root.txt" <|
                \_ -> Expect.equal (getFromAbsPath [ "/", "root.txt" ] dir) (Just (File ( "root.txt", 0 )))
            , test "echo" <|
                \_ -> Expect.equal (getFromAbsPath [ "/", "usr", "bin", "echo" ] dir) (Just (File ( "echo", 1 )))
            ]
        ]
