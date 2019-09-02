module FsTests exposing (fsTests)

import Expect
import Os exposing (..)
import Test exposing (..)


usr : Fs
usr =
    Dir
        ( []
        , "usr"
        , [ Dir
                ( [ "usr" ]
                , "bin"
                , [ File ( [ "usr", "bin" ], "echo", 1 )
                  ]
                )
          ]
        )


root : Fs
root =
    Dir
        ( []
        , ""
        , [ File ( [], "root.txt", 0 )
          , usr
          ]
        )


fsTests : Test
fsTests =
    describe "test Os module"
        [ describe "queryPath"
            [ test "root" <|
                \_ -> Expect.equal (queryPath root root []) (Just root)
            , test "root.txt" <|
                \_ -> Expect.equal (queryPath root root [ "root.txt" ]) (Just (File ( [], "root.txt", 0 )))
            , test "echo" <|
                \_ -> Expect.equal (queryPath root root [ "usr", "bin", "echo" ]) (Just (File ( [ "usr", "bin" ], "echo", 1 )))
            , test "relative echo" <|
                \_ -> Expect.equal (queryPath root usr [ "bin", "echo" ]) (Just (File ( [ "usr", "bin" ], "echo", 1 )))
            , test "relative echo 2" <|
                \_ -> Expect.equal (queryPath root usr [ ".", "bin", "echo" ]) (Just (File ( [ "usr", "bin" ], "echo", 1 )))
            , test "relative root.txt" <|
                \_ -> Expect.equal (queryPath root usr [ "..", "root.txt" ]) (Just (File ( [], "root.txt", 0 )))
            , test "not found" <|
                \_ -> Expect.equal (queryPath root root [ "usr", "bin", "ech" ]) Nothing
            ]
        ]
