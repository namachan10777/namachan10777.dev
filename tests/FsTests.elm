module FsTests exposing (fsTests)

import Expect
import Os exposing (..)
import Test exposing (..)


bin : Fs
bin =
    Dir
        ( [ "usr" ]
        , "bin"
        , [ File ( [ "usr", "bin" ], "echo", 1 )
          ]
        )


usr : Fs
usr =
    Dir
        ( []
        , "usr"
        , [ bin ]
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
        , describe "resolvePath"
            [ test "root" <|
                \_ -> Expect.equal (resolvePath root root "/") (Succes root)
            , test "root.txt" <|
                \_ -> Expect.equal (resolvePath root usr "/root.txt") (Succes (File ( [], "root.txt", 0 )))
            , test "root.txt not dir" <|
                \_ -> Expect.equal (resolvePath root usr "/root.txt/") (IsNotDir (File ( [], "root.txt", 0 )))
            , test "echo" <|
                \_ -> Expect.equal (resolvePath root usr "/usr/bin/echo") (Succes (File ( [ "usr", "bin" ], "echo", 1 )))
            , test "relative echo" <|
                \_ -> Expect.equal (resolvePath root usr "bin/echo") (Succes (File ( [ "usr", "bin" ], "echo", 1 )))
            , test "relative echo not dir" <|
                \_ -> Expect.equal (resolvePath root usr "bin/echo/") (IsNotDir (File ( [ "usr", "bin" ], "echo", 1 )))
            , test "relative echo 2" <|
                \_ -> Expect.equal (resolvePath root usr "./bin/echo") (Succes (File ( [ "usr", "bin" ], "echo", 1 )))
            , test "relative dir" <|
                \_ -> Expect.equal (resolvePath root usr "./bin/") (Succes bin)
            , test "relative root.txt" <|
                \_ -> Expect.equal (resolvePath root usr "../root.txt") (Succes (File ( [], "root.txt", 0 )))
            , test "not found" <|
                \_ -> Expect.equal (resolvePath root root "/usr/bin/ech") NotFound
            ]
        ]
